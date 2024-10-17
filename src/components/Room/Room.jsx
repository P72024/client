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
			<p>Type username below:</p>
			<input type='text' id="usernameInputField" value={username} placeholder='Johnny' required></input>
			<button onClick={createUsername}>Confirm Username</button>
			<br></br>
			<button onClick={logSessionData}>Console log session data</button>
			<button onClick={logSessionData}></button>
		</div>
		

	)
	}

	// TODO: Lav input handling!!! det her extremt vulnerable lol. 
	// TODO: Brug hooks til at håndtere state på inputfeltet. useState hook er smart her.
	async function createUsername () {
		const username = document.getElementById('usernameInputField').value
		console.log("sendding socket to backend. username = " + username)
		// TODO: BE er en hemmelighed
		socket.emit("BE-create-username", {
			username
		})
		
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
