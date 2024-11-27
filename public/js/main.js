'use strict';

const socket = io.connect();

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

/**
 * Initialize webrtc
 */
const webrtc = new Webrtc(socket, pcConfig, {
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
    document.getElementById('clienID').innerText = '';
    notify(`Left the room ${room}`);
    MicVAD.destroy();
    webSocket.close();
});

/**
 * Get local media
 */

let webSocket;

webrtc
    .getLocalStream(true, {width: 640, height: 480})
    .then((stream) => {
        const audioTracks = stream.getAudioTracks()
        localVideo.srcObject = stream
    });

webrtc.addEventListener('kicked', () => {
    document.querySelector('h1').textContent = 'You were kicked out';
    videoGrid.innerHTML = '';
    MicVAD.destroy();
    webSocket.close();
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
        webrtc.localStream.getAudioTracks()[0].enabled = true
        MicVAD.pause();
        console.log("Muted");
    }
    else {
        webrtc.localStream.getAudioTracks()[0].enabled = false
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
    console.log("CLIENT ID:")
    console.log(webrtc.socket.id);

    const clientID = webrtc.socket.id;
    const roomID = e.detail.roomId; 

    document.getElementById('clienID').innerText = clientID;
    document.getElementById('roomID').innerText = roomID;

    webSocket = initWebSocket();
    
    /**
        https://github.com/ricky0123/vad  TODO: cite this
    */

    let audioChunks = [];
    const minChunkSize = 16;

    MicVAD = await vad.MicVAD.new({
        onSpeechStart: () => {
            console.log("Speech start detected")
        },
        onFrameProcessed: (probabilities, audioFrame) => {
            if (probabilities.notSpeech > 0.8) {
                return;
            }

            audioChunks.push(Array.from(new Float32Array(audioFrame)));

            if (audioChunks.length >= minChunkSize) {
                console.log("sending audio")
                sendAudioData(clientID, roomID, audioChunks);
                audioChunks = [];
            }
        },
        onSpeechEnd: () => {
            if (audioChunks.length < minChunkSize) {
                console.log("end of sentence detected, sending remaining audio");
                sendAudioData(clientID, roomID, audioChunks);
                audioChunks = [];
            }
        }
    });

    MicVAD.start();
})

function sendAudioData(clientID, roomID, audioChunks) {
    const flattenedAudio = audioChunks.flat(1);

    const message = {
        clientId: clientID,
        audioData: Array.from(new Float32Array(flattenedAudio)),
        roomId: roomID
    };
    
    webSocket.send(JSON.stringify(message));
    console.log(message);
}

function initWebSocket() {
    const webSocket = new WebSocket('ws://localhost:3000');

    webSocket.onmessage = event => {
    console.log('Message from server:', event.data);
    let transcribed_text = event.data;

    document.getElementById('transcriptionText').innerText += " " + transcribed_text;

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
    
    return webSocket;
}

window.onbeforeunload = function() {
    MicVAD.destroy();
    webSocket.close();
    webrtc.leaveRoom();
}