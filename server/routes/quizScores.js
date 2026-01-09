import express from 'express';
import QuizScore from '../models/QuizScore.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/quiz-scores
// @desc    Log a quiz score
// @access  Private
router.post('/', protect, async (req, res) => {
    const { topic, score, totalQuestions } = req.body;
    try {
        const quiz = await QuizScore.create({
            user: req.user._id,
            topic,
            score,
            totalQuestions,
        });
        res.status(201).json(quiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/quiz-scores
// @desc    Get all quiz scores for user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const quizzes = await QuizScore.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
