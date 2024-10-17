import { React } from 'react'
import { useParams } from 'react-router-dom'
import socket from '../../socket'

const Room = (props) => {
	const { roomId } = useParams();
	return (
	<div>
		<p>Hello World from Room: {roomId}</p>
		<button onClick={logSessionData}>Console log session data</button>
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
