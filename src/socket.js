import io from 'socket.io-client';
const sockets = io('http://localhost:8080', { autoConnect: true, forceNew: true });
// const sockets = io('/');
export default sockets;