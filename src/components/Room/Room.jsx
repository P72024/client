	import { React, useEffect, useState } from 'react'
	import { useParams } from 'react-router-dom'
	import socket from '../../socket'

	let localStream;


	// TODO: if client in here without room_uuid in sessionstorage then redirect to /. In a useEffect hook

	const Room = (props) => {
		const { roomId } = useParams();
		const [text, setText] = useState("")
		socket.on("FE-receive-text", (data) => {
			setText(text + " " + data)
		})
		useEffect(() => {
			async function requestRecordPermission() {
				localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
				peerConnection = createWebRTCConnectionToServer()
				localStream.getTracks().forEach(track => {
					peerConnection.addTrack(track, localStream)
					console.log(track)
					}
				);
			}
			requestRecordPermission()
		}, [])
		
		return (
		<div>
			<p>Hello World from Room: {roomId}</p>
			<br></br>
			<button onClick={logSessionData}>Console log session data</button>
			<br></br>
			<p id="text" >text: {text}</p>
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

	socket.emit("BE-createPC")

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
