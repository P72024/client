	import { React, useEffect, useRef, useState } from 'react'
	import { useNavigate, useLocation, useParams } from 'react-router-dom'
	import socket from '../../socket'

	
    let localStream;
    
    
	// TODO: if client in here without room_uuid in sessionstorage then redirect to /. In a useEffect hook
    
	const Room = (props) => {
        const { roomId } = useParams();
		const [text, setText] = useState("")
        const pc = useRef(null);
        const loaded = useRef(false)
        const audio = useRef()
        const location = useLocation();
        const state = location.state;
        const navigate = useNavigate();


		socket.on("FE-receive-text", (data) => {
			setText(text + " " + data)
		})

        async function start() {
            console.log('Requesting local stream');
            localStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            audio.current.srcObject = localStream
        }

        async function setupDevice() {
            console.log('Starting calls');

            pc.current = new RTCPeerConnection();
            pc.current.ontrack = e => gotRemoteStream(e, audio.current);
            console.log('pc.current1: created local and remote peer connection objects');
          
            localStream.getTracks().forEach(track => {
              pc.current.addTrack(track, localStream);
            });
            await negotiate()
        }

        async function negotiate() {            
            const offer = await pc.current.createOffer()
            await pc.current.setLocalDescription(offer);
            
            socket.emit("BE-send-offer", pc.current.localDescription)
            setUpAudio()
        }

        socket.on("FE-send-answer", async answer => {
            console.log("signaling state: ", pc.current.signalingState)
            if (pc.current.signalingState !== "stable")
                await pc.current.setRemoteDescription(answer)
        })

        function setUpAudio() {
            navigator.mediaDevices.getUserMedia({
                audio: true
            }).then((stream) => {
                stream.getTracks().forEach((track) => {
                    pc.current.addTrack(track, localStream)
                })
            })
        }

        function gotRemoteStream(e, audioObject) {
            console.log("Got stream: ", e, audioObject)
            if (audioObject.srcObject !== e.streams[0]) {
              audioObject.srcObject = e.streams[0];
            }
        }

		useEffect(() => {
            if (!(state && state.visitedFromMainPage)) {
                console.log("user did not visit from main page. redirecting to main...")
                return navigate('/')
            } 
            async function test() { 
                await start()
                await setupDevice()
            }
            if (loaded.current === false) {
                test()
                loaded.current = true
            }
		}, [])
		
		return (
		<div>
			<p>Hello World from Room: {roomId}</p>
			<br></br>
			<button onClick={logSessionData}>Console log session data</button>
			<br></br>
			<p id="text" >text: {text}</p>
            <div>
                <div>Remote audio:</div>
                <audio hidden preload="auto" id="audio2" ref={audio} autoPlay controls></audio>
            </div>
		</div>
		

		)
}

let peerConnection = null

function createWebRTCConnectionToServer() {
	console.log("creating peer connection to server....")
	var config = {
        sdpSemantics: 'unified-plan'
    };
	peerConnection = new RTCPeerConnection(config)

	socket.emit("BE-createPC.current")

	peerConnection.ontrack = (event) => {
		const audioElement = document.createElement('audio');
		audioElement.srcObject = event.streams[0];
		audioElement.autoplay = true;
		document.body.appendChild(audioElement);
	};

	return peerConnection;
}


function requestSessionData() {
	socket.emit("BE-get-session");
}

socket.on("FE-session-data", (sessionData) => {
	console.log("Session data received:", sessionData);
})

function logSessionData() {
	requestSessionData()
}


export default Room
