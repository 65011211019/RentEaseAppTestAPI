import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import serverConfig from './config/server.config.js';
import './db/supabaseClient.js'; 

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import NotificationService from './services/notification.service.js';

dotenv.config(); // Load .env variables

const app = express();

// CORS configuration
const corsOptions = {
    origin: '*', // Allow all origins
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Allow cookies if your frontend needs to send them
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Middlewares
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Log request body for debugging
app.use((req, res, next) => {
    console.log('Request Body:', req.body);
    next();
});

// Main API Router
app.use('/api', routes);

// Centralized Error Handler
app.use(errorHandler);

// --- Socket.IO setup ---
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: { origin: '*' }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_conversation', (conversationId) => {
        socket.join(`conversation_${conversationId}`);
    });

    socket.on('send_message', (message) => {
        io.to(`conversation_${message.conversation_id}`).emit('new_message', message);
    });

    socket.on('join_user', (userId) => {
        socket.join(`user_${userId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// เพิ่มฟังก์ชัน helper สำหรับ emit notification realtime
export function emitNotificationToUser(userId, notification) {
    io.to(`user_${userId}`).emit('new_notification', notification);
}

// Start server
server.listen(serverConfig.PORT, () => {
    console.log(`🚀 Server is running on port ${serverConfig.PORT} in ${serverConfig.NODE_ENV} mode.`);
    console.log(`🔗 Access at http://localhost:${serverConfig.PORT}`);
});

export { app, io };