import { React } from 'react'
import { useParams } from 'react-router-dom'
import socket from '../../socket'

const Room = (props) => {
	const { roomId } = useParams();

    navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(stream => {
            
        })


	return (<p>Hello World from Room: {roomId}</p>)
}

export default Room
