	import { React, useEffect } from 'react'
	import { useParams } from 'react-router-dom'
	import socket from '../../socket'

	const Room = (props) => {
		var username
		const { roomId } = useParams();

		useEffect(() => {
			socket.emit("BE-enter-room", "uuid")
			console.log("Emitted BE-enter-room event with roomId:", roomId)
		}, [],)
		
		return (
		<div>
			<p>Hello World from Room: {roomId}</p>
			<br></br>
			<button onClick={logSessionData}>Console log session data</button>
			<button onClick={logSessionData}></button>
		</div>
		

)
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
