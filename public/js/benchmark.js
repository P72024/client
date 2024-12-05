document.getElementById('processFileBtn').addEventListener('click', async () => {
    const {minChunkSizeArray, speechThresholdArray} = await fetchConfig()

    document.getElementById('processFileBtn').disabled = true
    document.getElementById('joinBtn').disabled = true
    document.getElementById('joinBtn').style.backgroundColor = "#d3d3d3";


    const fileInput = document.getElementById('fileUpload');
    const file = fileInput.files[0];

    if (file) {
        fileInput.disabled = true
        const reader = new FileReader();
        reader.onload = async function (event) {
            const audioBuffer = event.target.result;
            // console.log(`audio buffer: ${audioBuffer.length}`);
            
            // console.log('Loaded audio file:', audioBuffer);

            try {
                max_counter = minChunkSizeArray.length * speechThresholdArray.length
                counter = 0
                document.getElementById("progressBar").textContent = `processing file... progess: ${counter} of ${max_counter}`
                for await (const minChunkSize of minChunkSizeArray) {
                    for (const speechThreshold of speechThresholdArray) {
                        await processFile(audioBuffer.slice(0), minChunkSize, speechThreshold).then(() => {
                            counter++
                            document.getElementById("progressBar").textContent = `processing file... progress: ${counter} of ${max_counter}`
                        })
                    }
                }
                document.getElementById('processFileBtn').disabled = false
                document.getElementById('joinBtn').disabled = false
                fileInput.disabled = false
                document.getElementById('joinBtn').style.backgroundColor = "#4caf50;"
                document.getElementById("progressBar").textContent = "WE DONE BOIS!"


            } catch (err) {
                console.error('Error processing file:', err);
            }
        };
        reader.readAsArrayBuffer(file); // Read file as an ArrayBuffer
    } else {
        alert('Please select a file first!');
    }
});

async function processFile(audioBuffer, _minChunkSize, _speechThreshold) {
    return new Promise(async (resolve, reject) => {
        console.log(`processing file with params: minChunkSize: ${_minChunkSize}, speechThreshold: ${_speechThreshold}`);
        try {
            // Decode audio data into an AudioBuffer
            const audioContext = new AudioContext();
            const decodedAudio = await audioContext.decodeAudioData(audioBuffer);
            /**
            https://github.com/ricky0123/vad  TODO: cite this
            */
            const streamDestination = audioContext.createMediaStreamDestination();
            const source = audioContext.createBufferSource();
            source.buffer = decodedAudio;
            source.connect(streamDestination);
            source.start();
            const audioStream = streamDestination.stream;
    
            let audioChunks = [];
            
            
            const MicVAD = await vad.MicVAD.new({
                audioStream,
                onSpeechStart: () => {
                    // console.log("Speech start detected from source");
                },
                onFrameProcessed: (probabilities, audioFrame) => {
                    if (probabilities.isSpeech > _speechThreshold) {
                        audioChunks.push(Array.from(new Float32Array(audioFrame)));
    
                        if (audioChunks.length >= _minChunkSize) {
                            // console.log("Processing audio, audioChunks length: ", audioChunks.length);
                            sendAudioData(`benchmark-min_chunk_size:${_minChunkSize}`, `benchmark-speech_threshold:${_speechThreshold}`, audioChunks);
                            audioChunks = [];
                        }
                    }
                },
                onSpeechEnd: () => {
                    if (audioChunks.length > 0 && audioChunks.length < _minChunkSize) {
                        // console.log("End of speech detected, processing remaining audio, audioChunks length: ", audioChunks.length);
                        sendAudioData(`benchmark-min_chunk_size:${_minChunkSize}`, `benchmark-speech_threshold:${_speechThreshold}`, audioChunks);
                        audioChunks = [];
                    }
                }
    
            });
    
            console.log("Processing audio file through VAD");
            MicVAD.start()
    
            source.onended = () => {
                console.log("Audio file done playing. stopping micVAD")
                MicVAD.destroy()
                resolve()
            }
    
        } catch (err) {
            console.error("Error during file processing:", err);
            reject()
        }
    })
    
}


// Helper function to check if a file exists
async function fileExists(filePath) {
    try {
        const response = await fetch(filePath, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}


async function fetchConfig() {
    return fetch('/config.json')
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to fetch config.json: ${response.statusText}`);
            }
            return response.json();
        })
        .then((config) => {
            const minChunkSizeArray = config.grid_search.parameters.min_chunk_size;
            const speechThresholdArray = config.grid_search.parameters.VAD_filter_threshold;
            
            // Return the arrays in an object
            return { minChunkSizeArray, speechThresholdArray };
        })
        .catch((error) => {
            console.error('Error fetching config.json:', error);
            throw error; // Re-throw the error to handle it in the calling code
        });
}