const webSocket = new WebSocket('ws://127.0.0.1:3000');

webSocket.onmessage = event => {
    console.log('Message from server:', event.data);
};

webSocket.onopen = () => {
    console.log('Connected to server');
};

webSocket.onclose = event => {
    console.log('Disconnected from server:', event.code, event.reason);
};

webSocket.onerror = error => {
    console.error('Error:', error);
};

const constraints = { audio: true };
let recorder;
let firstBlob; 

function start() {
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(mediaStream => {
            // Use MediaStream Recording API
            recorder = new MediaRecorder(mediaStream);

            // Fires every two seconds and passes a BlobEvent
            recorder.ondataavailable = event => {
                const blob = event.data;
                
                // Store metadata from the first blob
                if (!firstBlob) {
                    firstBlob = blob;
                }

                // Combine metadata with raw audio data for each blob
                const combinedBlob = new Blob([firstBlob, blob], { type: blob.type });

                // Send the combined blob (metadata + raw audio) to the server
                webSocket.send(combinedBlob);
            };
        });
}

function stop() {
    recorder.stop();
    webSocket.close(1000, "Finished sending audio");
}