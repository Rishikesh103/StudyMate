import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http'; // <--- NEW LINE 1: Import http server
import { initializeSocket } from './utils/socketManager.js'; // <--- NEW LINE 2: Import your manager

import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import studySessionRoutes from './routes/studySessions.js';
import quizScoreRoutes from './routes/quizScores.js';
import quizRoutes from './routes/quizzes.js';
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';
import revisionRoutes from './routes/revision.js';
import notesRoutes from './routes/notes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- NEW SECTION START ---
// We wrap the express app in a raw HTTP server so Socket.io can attach to it
const httpServer = createServer(app);

// Initialize Socket.io on this server
const io = initializeSocket(httpServer);
// --- NEW SECTION END ---

// Database Connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/study-sessions', studySessionRoutes);
app.use('/api/quiz-scores', quizScoreRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/revision', revisionRoutes);
app.use('/api/notes', notesRoutes);

// Base Route
app.get('/', (req, res) => {
    res.send('StudyMate API is running');
});

const PORT = process.env.PORT || 5000;

// --- CHANGED LINE ---
// Instead of app.listen, we use httpServer.listen
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.io initialized`);
});