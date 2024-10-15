import React from 'react'
import { useParams } from 'react-router-dom'

const Room = (props) => {
	const { roomId } = useParams();
	return (<p>Hello World from Room: {roomId}</p>)
}

export default Room
