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

    /**
     * Handle message from a client
     * If toId is provided message will be sent ONLY to the client with that id
     * If toId is NOT provided and room IS provided message will be broadcast to that room
     * If NONE is provided message will be sent to all clients
     */
    socket.on('message', (message: any, toId: string | null = null, room: string | null = null) => {
        log('Client ' + socket.id + ' said: ', message);

        if (toId) {
            console.log('From ', socket.id, ' to ', toId, message.type);
            io.to(toId).emit('message', message, socket.id);
        } else if (room) {
            console.log('From ', socket.id, ' to room: ', room, message.type);
            socket.broadcast.to(room).emit('message', message, socket.id);
        } else {
            console.log('From ', socket.id, ' to everyone ', message.type);
            socket.broadcast.emit('message', message, socket.id);
        }
    });

    let roomAdmin: string; // save admins socket id (will get overwritten if new room gets created)

    /**
     * When room gets created or someone joins it
     */
    socket.on('create or join', (room: string) => {
        log('Create or Join room: ' + room);

        // Get number of clients in the room
        const clientsInRoom = io.sockets.adapter.rooms.get(room);
        let numClients = clientsInRoom ? clientsInRoom.size : 0;

        if (numClients === 0) {
            // Create room
            socket.join(room);
            roomAdmin = socket.id;
            socket.emit('created', room, socket.id);
        } else {
            log('Client ' + socket.id + ' joined room ' + room);

            // Join room
            io.sockets.in(room).emit('join', room); // Notify users in room
            socket.join(room);
            io.to(socket.id).emit('joined', room, socket.id); // Notify client that they joined a room
            io.sockets.in(room).emit('ready', socket.id); // Room is ready for creating connections
        }
    });

    /**
     * Kick participant from a call
     */
    socket.on('kickout', (socketId: string, room: string) => {
        if (socket.id === roomAdmin) {
            socket.broadcast.emit('kickout', socketId);
            io.sockets.sockets.get(socketId)?.leave(room);
        } else {
            console.log('not an admin');
        }
    });

    // participant leaves room
    socket.on('leave room', (room: string) => {
        socket.leave(room);
        socket.emit('left room', room);
        socket.broadcast.to(room).emit('message', { type: 'leave' }, socket.id);
    });

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