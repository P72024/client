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

async function start() {
    console.log("recording..");
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
        
    // Use MediaStream Recording API
    recorder = new MediaRecorder(mediaStream);

    // Fires every two seconds and passes a BlobEvent
    recorder.ondataavailable = event => {

        
        event.data.arrayBuffer().then((bytes) => console.log(bytes));
        console.log(event.type);
        console.log(event.data);

        
        webSocket.send(event.data);
    };

    recorder.start(100);
}

function stop() {
    recorder.stop();
    webSocket.close(1000, "Finished sending audio");
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}