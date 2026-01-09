import { Server } from 'socket.io';

let io;

export const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            // Allow connections from your frontend (Vite usually runs on 5173)
            origin: ["http://localhost:5173", "http://localhost:3000"],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 New client connected: ${socket.id}`);

        // Join a specific room (e.g., for a specific user)
        socket.on('join_user', (userId) => {
            socket.join(userId);
            console.log(`👤 User ${userId} joined their personal room`);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

// Helper to get the IO instance later if needed in other files
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};