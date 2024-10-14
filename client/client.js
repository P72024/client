const webSocket = new WebSocket('ws://127.0.0.1:3000');

webSocket.onmessage = event => {
    console.log('Message from server:', event.data);
}

webSocket.onopen = () => {
    console.log('Connected to server');
};

webSocket.onclose = (event) => {
    console.log('Disconnected from server: ', event.code, event.reason);
};

webSocket.onerror = error => {
    console.error('Error:', error);
}

const constraints = { audio: true };
let recorder;

function start() {
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(mediaStream => {

        // use MediaStream Recording API
        recorder = new MediaRecorder(mediaStream);

        // fires every one second and passes an BlobEvent
        recorder.ondataavailable = event => {
            // get the Blob from the event
            const blob = event.data;

            // and send that blob to the server...
            webSocket.send(blob);
        };

        // make data available event fire every one second
        recorder.start(2000);
    });
}

function stop() {
    recorder.stop();
    webSocket.close(1000, "Finished sending audio");
}