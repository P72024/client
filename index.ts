import path from 'path';
import express, { type Request, type Response, type NextFunction } from 'express';
import { Server as SocketIOServer, Socket } from 'socket.io';
import http from 'http';

const app = express();
const port = process.env.PORT || 8080;
const env = process.env.NODE_ENV || 'development';

// Redirect to https
app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['x-forwarded-proto'] !== 'https' && env !== 'development') {
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

const server = http.createServer(app);
server.listen(port, () => {
    console.log(`listening on port ${port}`);
});

export const webSocket = initWebSocket()

function initWebSocket() {
    const webSocket = new WebSocket('https://87f6-130-225-38-116.ngrok-free.app');

    webSocket.onmessage = event => {
        console.log('Message from server:', event.data);
        let transcribedText = event.data;

        const transcriptionTextElement = document.getElementById('transcriptionText');
        if (transcriptionTextElement) {
            transcriptionTextElement.innerText += " " + transcribedText;
        }
        else {
            console.log("No element with id: transcriptionText")
        }
    };

    webSocket.onopen = () => {
        console.log('Connected to server');
    };

    webSocket.onclose = event => {
        console.log('Disconnected from server:', event.code, event.reason);
    };

    webSocket.onerror = error => {
        console.error('Error:', error);
    };
    
    return webSocket;
}

/**
 * Socket.io events
 */
const io = new SocketIOServer(server);

io.sockets.on('connection', (socket: Socket) => {
    /**
     * Log actions to the client
     */
    function log(...args: any[]) {
        const array = ['Server:'];
        array.push(...args);
        socket.emit('log', array);
    }

    let roomAdmin: string; // save admins socket id (will get overwritten if new room gets created)



    /**
     * When participant leaves notify other participants
     */
    socket.on('disconnecting', () => {
        socket.rooms.forEach((room) => {
            if (room === socket.id) return;
            socket.broadcast.to(room).emit('message', { type: 'leave' }, socket.id);
        });
    });
});
