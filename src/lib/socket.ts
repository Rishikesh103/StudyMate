import { io } from "socket.io-client";

// Ensure this matches your backend URL
const SOCKET_URL = "http://localhost:5000";

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
});

export const connectSocket = (userId: string) => {
    if (!socket.connected) {
        socket.connect();
        socket.emit("join_user", userId);
        console.log("🔌 Connecting to socket...");
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
        console.log("❌ Disconnected from socket");
    }
};