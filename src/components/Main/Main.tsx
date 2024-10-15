import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'

const Main = () => {
	const navigate = useNavigate()

	async function createRoom() {
		const response = await fetch('http://127.0.0.1:8080/createRoomUUID', {
			method: 'GET',
		})
		const uuid = await response.text()
		window.history.pushState({}, `Room: ${uuid}`, `/room/${uuid}`)
		navigate(`/room/${uuid}`)

	}

	return (<div>
		<h1>Welcome to the most awesome Conference App </h1>
		<h2>Please create a new room :)</h2>
		<button onClick={createRoom}>Create Room</button>

	</div>
	)
}



export default Main
