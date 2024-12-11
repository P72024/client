'use strict';

let screenName = '';
let lastScreenName = '';

document.getElementById('confirmNameBtn').addEventListener('click', () => {
    screenName = document.getElementById('screenName').value;
    if (screenName) {
        document.getElementById('screenNameText').innerText = screenName;
    } else {
        alert('Please enter a screen name.');
    }
});

const localVideo = document.querySelector('#localVideo-container video');
const videoGrid = document.querySelector('#videoGrid');
const notification = document.querySelector('#notification');
const notify = (message) => {
    notification.innerHTML = message;

};

const pcConfig = {
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun3.l.google.com:19302',
                'stun:stun4.l.google.com:19302',
            ],
        },
        {
            urls: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com',
        },
        {
            urls: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com',
        },
        {
            urls: 'turn:192.158.29.39:3478?transport=udp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808',
        },
    ],
};

let MicVAD = null;

const webSocket = initWebSocket()

/**
 * Initialize webrtc
 */
const webrtc = new Webrtc(webSocket, pcConfig, {
    log: true,
    warn: true,
    error: true,
});

/**
 * Create or join a room
 */
const roomInput = document.querySelector('#roomId');
const joinBtn = document.querySelector('#joinBtn');
joinBtn.addEventListener('click', () => {
    const room = roomInput.value;
    if (!room) {
        notify('Room ID not provided');
        return;
    }

    webrtc.joinRoom(room);

});

const setTitle = (status, e) => {
    const room = e.detail.roomId;

    console.log(`Room ${room} was ${status}`);

    notify(`Room ${room} was ${status}`);
    document.querySelector('h1').textContent = `Room: ${room}`;
    webrtc.gotStream();
};
webrtc.addEventListener('createdRoom', setTitle.bind(this, 'created'));
webrtc.addEventListener('joinedRoom', setTitle.bind(this, 'joined'));

/**
 * Leave the room
 */
const leaveBtn = document.querySelector('#leaveBtn');
leaveBtn.addEventListener('click', () => {
    webrtc.leaveRoom();
});
webrtc.addEventListener('leftRoom', (e) => {
    const room = e.detail.roomId;
    document.querySelector('h1').textContent = '';
    // Clear the values
    document.querySelector('#roomID').innerText = '';
    document.querySelector('#transcriptionText').innerText = '';
    document.getElementById('clientID').innerText = '';
    notify(`Left the room ${room}`);
    MicVAD.destroy();
});

/**
 * Get local media
 */

webrtc
    .getLocalStream(true, {width: 640, height: 480})
    .then((stream) => {
        localVideo.srcObject = stream
    });

webrtc.addEventListener('kicked', () => {
    document.querySelector('h1').textContent = 'You were kicked out';
    webrtc.kicked();
    videoGrid.innerHTML = '';
    MicVAD.destroy();
});

webrtc.addEventListener('userLeave', (e) => {
    console.log(`user ${e.detail.socketId} left room`);
});

/**
 * Handle new user connection
 */
webrtc.addEventListener('newUser', (e) => {
    const socketId = e.detail.socketId;
    const stream = e.detail.stream;

    const videoContainer = document.createElement('div');
    videoContainer.setAttribute('class', 'grid-item');
    videoContainer.setAttribute('id', socketId);

    const video = document.createElement('video');
    video.setAttribute('autoplay', true);
    video.setAttribute('muted', true); // set to false
    video.setAttribute('playsinline', true);
    video.srcObject = stream;

    const p = document.createElement('p');
    p.textContent = socketId;

    videoContainer.append(p);
    videoContainer.append(video);

    // If user is admin add kick buttons
    if (webrtc.isAdmin) {
        const kickBtn = document.createElement('button');
        kickBtn.setAttribute('class', 'kick_btn');
        kickBtn.textContent = 'Kick';

        kickBtn.addEventListener('click', () => {
            webrtc.kickUser(socketId);
        });

        videoContainer.append(kickBtn);
    }
    videoGrid.append(videoContainer);
});

/**
 * Handle user got removed
 */
webrtc.addEventListener('removeUser', (e) => {
    const socketId = e.detail.socketId;
    if (!socketId) {
        // remove all remote stream elements
        videoGrid.innerHTML = '';
        return;
    }
    document.getElementById(socketId).remove();
});

document.querySelector('#mute').addEventListener('change', (e) => {
    console.log(e.target.checked);
    if (e.target.checked) {
        webrtc.localStream.getAudioTracks()[0].enabled = false
        MicVAD.pause();
        console.log("Muted");
    }
    else {
        webrtc.localStream.getAudioTracks()[0].enabled = true
        MicVAD.start();
        console.log("Unmuted");
    }
});

/**
 * Handle errors
 */
webrtc.addEventListener('error', (e) => {
    const error = e.detail.error;
    console.error(error);

    notify(error);
});

/**
 * Handle notifications
 */
webrtc.addEventListener('notification', (e) => {
    const notif = e.detail.notification;
    console.log(notif);

    notify(notif);
});

webrtc.addEventListener('join_room', async (e) => {
    console.log(e.detail.roomId);

    console.log("join_room");

    const clientID = webrtc.myId;
    const roomID = e.detail.roomId; 
    console.log("ROOM ID:")
    console.log(roomID)

    console.log("CLIENT ID:")
    console.log(clientID)


    document.getElementById('clientID').innerText = clientID;
    document.getElementById('roomID').innerText = roomID;

    const updateMessage = "Measuring...";

    document.getElementById('metrics_latency').innerText = updateMessage;
    document.getElementById('metrics_round_trip_time').innerText = updateMessage;
    document.getElementById('metrics_audio_queue_wait_time').innerText = updateMessage;
    document.getElementById('metrics_total_transcription_time').innerText = updateMessage;
    document.getElementById('metrics_transcription_time').innerText = updateMessage;
    document.getElementById('metrics_update_context_time').innerText = updateMessage;
    document.getElementById('metrics_curr_vad_latency').innerText = updateMessage;
    document.getElementById('metrics_avg_vad_latency').innerText = updateMessage;
    document.getElementById('metrics_min_vad_latency').innerText = updateMessage;
    document.getElementById('metrics_max_vad_latency').innerText = updateMessage;
    
    /**
        https://github.com/ricky0123/vad  TODO: cite this
    */

    let audioChunks = [];
    const minChunkSize = 16; 
    const speechThreshold = 0.8;

    MicVAD = await vad.MicVAD.new({
        onSpeechStart: () => {
            console.log("Speech start detected")
            speechStartTimestamp = performance.now();
        },
        onFrameProcessed: (probabilities, audioFrame) => {   
            measureVadLatency();

            if (probabilities.isSpeech > speechThreshold) {
                audioChunks.push(Array.from(new Float32Array(audioFrame)));

                if (audioChunks.length >= minChunkSize) {
                    console.log("sending audio, audioChunks length: ", audioChunks.length);
                    sendAudioData(clientID, roomID, audioChunks);
                    audioChunks = [];
                }
            }
        },
        onSpeechEnd: () => {
            if (audioChunks.length > 0 && audioChunks.length < minChunkSize) {
                console.log("end of sentence detected, sending remaining audio, audioChunks length: ", audioChunks.length);
                sendAudioData(clientID, roomID, audioChunks);
                audioChunks = [];
            }
        }
    });
   
    MicVAD.start();
})

let latencyMeasurements = [];
let speechStartTimestamp = null;

function measureVadLatency() {
    if (speechStartTimestamp !== null) {
        const currentLatency = performance.now() - speechStartTimestamp;
        
        document.getElementById('metrics_curr_vad_latency').innerText = `${currentLatency.toFixed(2)} ms`;
        latencyMeasurements.push(currentLatency);
        
        if (latencyMeasurements.length >= 5) {
            const avgLatency = latencyMeasurements.reduce((a, b) => a + b, 0) / latencyMeasurements.length;
            const minLatency = Math.min(...latencyMeasurements);
            const maxLatency = Math.max(...latencyMeasurements);
            
            document.getElementById('metrics_avg_vad_latency').innerText = `${avgLatency.toFixed(2)} ms`;
            document.getElementById('metrics_min_vad_latency').innerText = `${minLatency.toFixed(2)} ms`;
            document.getElementById('metrics_max_vad_latency').innerText = `${maxLatency.toFixed(2)} ms`;
            
            latencyMeasurements = [];
        }
        
        speechStartTimestamp = null;
    }
}

function sendAudioData(clientID, roomID, audioChunks) {
    console.log("flattening audio chunks");
    
    const flattenedAudio = audioChunks.flat(1);

    console.log("flattened audio chunks length ", flattenedAudio.length);

    const message = {
        clientId: clientID,
        screenName: screenName || clientID,
        audioData: Array.from(new Float32Array(flattenedAudio)),
        roomId: roomID,
        sentAt: Date.now(),
        type: "audio",
    };

    console.log("Sending message to server");
    webSocket.send(JSON.stringify(message));
}

let pingTimer = null;


function initWebSocket() {
    const webSocket = new WebSocket('ws://localhost:3000');

    webSocket.onmessage = event => {
        const data = JSON.parse(event.data)
        console.log('Message from server:', data);
        switch (data.type) {
            case "created":
                createRoom(data)
                break
            case "joined":
                joinedRoom(data)
                break
            case "left room":
                leaveRoom(data)
                break
            case "join":
                joinRoom(data)
                break
            case "ready":
                ready(data)
                break
            case "kickout":
                kickout(data)
                break
            case "leave":
                userLeft(data)
            case "message":
                message(data)
                break
            case "get id":
                getId(data)
                break
            case "transcribed text":
                getTranscribedText(data)
                break
            case "ping":
                document.getElementById('metrics_ping').innerText = `${Date.now() - data.sentAt} ms`;
                break
            default:
                console.log("Incorrect type on message: ", data)
                break
        }
    };

    webSocket.onopen = () => {
        console.log('Connected to server');
        webSocket.send(JSON.stringify({ type: "create id" }));

        pingTimer = setInterval(() => {
            webSocket.send(JSON.stringify({ type: "ping", sentAt: Date.now()}));
        }, 3000);
    };
    
    webSocket.onclose = event => {
        console.log('Disconnected from server:', event.code, event.reason);
    };
    
    webSocket.onerror = error => {
        console.error('Error:', error);
        reset();
    };
    
    return webSocket;
}

function createRoom(data) {
    const roomID = data.message.room_id;
    webrtc.room = roomID;
    webrtc._myId = data.message.client_id;
    webrtc.isInitiator = true;
    webrtc._isAdmin = true;

    webrtc._emit('createdRoom', { roomId: roomID });
}

function joinedRoom(data) {
    const roomID = data.message.room_id;
    webrtc.log('joined: ' + roomID);

    webrtc.room = roomID;
    webrtc.isReady = true;
    webrtc._myId = data.message.client_id;

    webrtc._emit('joinedRoom', { roomId: roomID });
}

function leaveRoom(data) {
    const roomID = data.message;
    if (roomID === webrtc.room) {
        webrtc.warn(`Left the room ${roomID}`);

        webrtc.room = null;
        webrtc._isAdmin = false
        webrtc._removeUser();
        webrtc._emit('leftRoom', {
            roomId: roomID,
        });
    }
}

function joinRoom(data) {
    const roomID = data.message;

    webrtc.log('Incoming request to join room: ' + roomID);

    webrtc.isReady = true;

    webrtc.dispatchEvent(new Event('newJoin'));
}

function ready(data) {
    const user = data.message;
    webrtc.log('User: ', user, ' joined room');

    if (user !== webrtc._myId && webrtc.inCall) webrtc.isInitiator = true;
}

function kickout(data) {
    const socketId = data.message;
    webrtc.log('kickout user: ', socketId);

    if (socketId === webrtc._myId) {
        // You got kicked out
        webrtc.dispatchEvent(new Event('kicked'));
        webrtc._removeUser();
        document.getElementById('transcriptionText').innerHTML = "";
        document.getElementById('clientID').innerText = "";
        document.getElementById('roomID').innerText = "";
    } else {
        // Someone else got kicked out
        webrtc._removeUser(socketId);
    }
}

function userLeft(data) {
    const socketId = data.message
    webrtc.log(socketId, 'Left the call.');
    webrtc._removeUser(socketId);
    webrtc.isInitiator = true;

    webrtc._emit('userLeave', { socketId: socketId });
    return;
}

function message(data) {
    const message = data.message.message;
    const socketId = data.message.client_id;
    webrtc.log('From', socketId, ' received:', message.type);

    // Avoid dublicate connections
    if (
        webrtc.pcs[socketId] &&
        webrtc.pcs[socketId].connectionState === 'connected'
    ) {
        webrtc.log(
            'Connection with ',
            socketId,
            'is already established'
        );
        return;
    }
    else if (socketId == webrtc.myId) {
        webrtc.log(
            'Trying to connect to themselves',
            socketId,
        )
    }

    switch (message.type) {
        case 'gotstream': // user is ready to share their stream
            webrtc._connect(socketId);
            break;
        case 'offer': // got connection offer
            if (!webrtc.pcs[socketId]) {
                webrtc._connect(socketId);
            }
            webrtc.pcs[socketId].setRemoteDescription(
                new RTCSessionDescription(message)
            );
            webrtc._answer(socketId);
            break;
        case 'answer': // got answer for sent offer
            webrtc.pcs[socketId].setRemoteDescription(
                new RTCSessionDescription(message)
            );
            break;
        case 'candidate': // received candidate sdp
            webrtc.inCall = true;
            const candidate = new RTCIceCandidate({
                sdpMLineIndex: message.label,
                candidate: message.candidate,
            });
            webrtc.pcs[socketId].addIceCandidate(candidate);
            break;
    }
}

function getId(data){
    webrtc._myId = data.message;
}


const transcriptionContainer = document.querySelector('.transcription_box');
let isUserScrolling = false; // To track if the user has scrolled up manually

transcriptionContainer.addEventListener('scroll', () => {
    if (!isScrolledToBottom()) {
        isUserScrolling = true; // User has scrolled up
    } else {
        isUserScrolling = false; // User is at the bottom
    }
});

function isScrolledToBottom() {
    return transcriptionContainer.scrollHeight - transcriptionContainer.scrollTop === transcriptionContainer.clientHeight;
}

function scrollToBottom() {
    if (!isUserScrolling) {
        transcriptionContainer.scrollTop = transcriptionContainer.scrollHeight;
    }
}

function getTranscribedText(data) {
    let transcribedText = data.message;
    let screenName = data.screen_name;
    const transcriptionTextElement = document.getElementById('transcriptionText');
    
    if (transcriptionTextElement) {
        if(screenName !== lastScreenName){
            transcriptionTextElement.innerHTML += `<br><strong>${screenName}:</strong> ${transcribedText}`;
            lastScreenName = screenName;
        }else{
            transcriptionTextElement.innerHTML += ` ${transcribedText}`;
        }        
        scrollToBottom();
    }
    else {
        console.log("No element with id: transcriptionText")
    }
  
    const latency = Math.round(data.receivedAt - data.sentAt);
    const roundTripTime = Math.round(Date.now() - data.sentAt);
    const totalTranscriptionProcessingTime = Math.round(data.processingTime.total);
    const transcriptionTime = Math.round(data.processingTime.transcription_time);
    const updateContextTime = Math.round(data.processingTime.update_context_time);
    const audioQueueWaitTime = Math.round(data.queueWaitTime);

    document.getElementById('metrics_latency').innerText = `${latency} ms`;
    document.getElementById('metrics_round_trip_time').innerText = `${roundTripTime} ms`;
    document.getElementById('metrics_total_transcription_time').innerText = `${totalTranscriptionProcessingTime} ms`;
    document.getElementById('metrics_transcription_time').innerText = `${transcriptionTime} ms`;
    document.getElementById('metrics_update_context_time').innerText = `${updateContextTime} ms`;
    document.getElementById('metrics_audio_queue_wait_time').innerText = `${audioQueueWaitTime} ms`;
}

window.onbeforeunload = reset;

function reset() {
    MicVAD.destroy();
    pingTimer && clearInterval(pingTimer);
    webSocket.send(JSON.stringify({
        "roomId": webrtc.roomId,
        "clientId": webrtc.myId,
        "type": "disconnecting"
    }))
    webSocket.close();
    webrtc.leaveRoom();
}