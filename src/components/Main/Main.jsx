import { useNavigate } from 'react-router-dom'
import socket from "../../socket"

const Main = () => {
	let username
	const navigate = useNavigate()

	async function sendUsername() {
		// TODO: Lav input handling!!! det her extremt vulnerable lol. 
        // TODO: Brug hooks til at håndtere state på inputfeltet. useState hook er smart her.
        const username = document.getElementById("usernameInputField").value
        console.log("sending socket to backend. username = " + username)
        // TODO: BE er en hemmelighed
        await socket.emit("BE-create-username", {
            username
        })
	}

	async function createRoom() {
		await sendUsername()

		const response = await fetch('http://127.0.0.1:8080/createRoomUUID', {
			method: 'GET',
		})
		const uuid = await response.text()

        
		console.log("uuid: " + uuid)

		await socket.emit("BE-enter-room", {
			uuid
		}, (response) => {
			if (response === "OK") {
				window.history.pushState({}, `Room: ${uuid}`, `/room/${uuid}`)
				navigate(`/room/${uuid}`)
			}
			else console.log("No room created. Response: " + response)
		})  
		
		}

	async function joinRoom() {
		await sendUsername()
		socket.emit("BE-send-room-uuid", (uuid) => {
			socket.emit("BE-enter-room", {
				uuid
			}, (response) => {
				if (response === "OK") {
					window.history.pushState({}, `Room: ${uuid}`, `/room/${uuid}`)
					navigate(`/room/${uuid}`)
				}
				else console.log("No room created. Response: " + response)
			})
		})
	}

	return (<div>
		<h1>Welcome to the most awesome Conference App </h1>
		<h2>Please choose a Username and create a new room :)</h2>
        <input type='text' id="usernameInputField" value={username} placeholder='Johnny' required></input>
		<button onClick={createRoom}>Create Room</button>
		<br></br>
		<button onClick={joinRoom}>Join Room</button>
	</div>
	)
}


export default Main
