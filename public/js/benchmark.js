document.getElementById('processFileBtn').addEventListener('click', async () => {
    const {minChunkSizeArray, speechThresholdArray} = await fetchConfig()

    document.getElementById('processFileBtn').disabled = true
    document.getElementById('joinBtn').disabled = true
    document.getElementById('joinBtn').style.backgroundColor = "#d3d3d3";


    const fileInput = document.getElementById('fileUpload');
    const file = fileInput.files[0];

    // Setting the csv header
    benchmarkingWriteResultToCsv([
        ["min_chunk_size", "speech_threshold", "timer_type", "timer_value"]
    ])

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
                
                // save the csv file on local pc
                var encodedUri = encodeURI(csvContent);
                window.open(encodedUri);
                
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
        console.log(`Processing file with params: minChunkSize: ${_minChunkSize}, speechThreshold: ${_speechThreshold}`);
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Decode the audioBuffer if it's not already an AudioBuffer
            if (!(audioBuffer instanceof AudioBuffer)) {
                audioBuffer = await audioContext.decodeAudioData(audioBuffer);
            }

            // Create a MediaStreamDestination for audio processing
            const audioStreamDestination = audioContext.createMediaStreamDestination();

            // Create an AudioBufferSourceNode and set its buffer
            const sourceNode = audioContext.createBufferSource();
            sourceNode.buffer = audioBuffer;

            // Connect the source node to the MediaStream destination
            sourceNode.connect(audioStreamDestination);
            sourceNode.connect(audioContext.destination); // Optional: connect for playback

            // The resulting MediaStream for VAD processing
            const audioStream = audioStreamDestination.stream;            

            // Prepare for VAD processing
            let audioChunks = [];

            let vadTimer;
            let chunkTimer;

            const MicVAD = await vad.MicVAD.new({
                stream: audioStream,
                onSpeechStart: () => {
                    console.log("Speech start detected");
                },
                onFrameProcessed: (probabilities, audioFrame) => {
                    // vadfilet test stop
                    if (vadTimer) {
                        console.log("VAD filter test done");
                        console.log(`Time taken for VAD filter test: ${performance.now() - vadTimer}ms`);
                        benchmarkingWriteResultToCsv([
                            [
                                _minChunkSize,
                                _speechThreshold,
                                "VADFilterTime",
                                performance.now() - vadTimer
                            ]
                        ])
                        vadTimer = null;
                    }

                    if (probabilities.isSpeech > _speechThreshold) {
                        audioChunks.push(Array.from(new Float32Array(audioFrame)));

                        if (audioChunks.length >= _minChunkSize) {
                            //chunk timer stop
                            if (chunkTimer) {
                                console.log(`Time taken for chunk: ${performance.now() - chunkTimer}ms`);
                                benchmarkingWriteResultToCsv([
                                    [
                                        _minChunkSize,
                                        _speechThreshold,
                                        "chunkProcessTime",
                                        performance.now() - chunkTimer
                                    ]
                                ])
                                chunkTimer = null;
                            }

                            sendAudioData(`benchmark-min_chunk_size:${_minChunkSize}`, `benchmark-speech_threshold:${_speechThreshold}`, audioChunks, "benchmarking");

                            // chunk timer start
                            audioChunks = [];
                            chunkTimer = performance.now();
                        }
                    }
                },
                onSpeechEnd: () => {
                    if (audioChunks.length > 0 && audioChunks.length < _minChunkSize) {
                        sendAudioData(`benchmark-min_chunk_size:${_minChunkSize}`, `benchmark-speech_threshold:${_speechThreshold}`, audioChunks, "benchmarking");
                        audioChunks = [];
                    }
                }
            });

            console.log("Processing audio file through VAD");
            
            MicVAD.start();
            // Start playback of the audio
            sourceNode.start(0);

            // vad filter test start.
            vadTimer = performance.now();

            // Handle when the audio file finishes playing
            sourceNode.onended = () => {
                console.log("Audio file done playing. Stopping MicVAD");
                MicVAD.destroy();
                resolve();
            };
        } catch (err) {
            console.error("Error during file processing:", err);
            reject(err);
        }
    });
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