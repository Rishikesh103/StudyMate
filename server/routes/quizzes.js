import express from 'express';
import Quiz from '../models/Quiz.js';
import QuizScore from '../models/QuizScore.js';
import { protect } from '../middleware/authMiddleware.js';
import { Ollama } from 'ollama';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Ollama client
const ollama = new Ollama({
    host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
});

// Groq fallback
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const USE_OLLAMA = process.env.USE_OLLAMA !== 'false';

// @route   POST /api/quizzes/generate
router.post('/generate', protect, async (req, res) => {
    const { topic, subject, difficulty = 'medium', questionCount = 10 } = req.body;

    try {
        const prompt = `Generate ${questionCount} ${difficulty} level multiple-choice quiz questions about "${topic}"${subject ? ` in ${subject}` : ''}.

For each question, provide:
1. Question text
2. Exactly 4 answer options
3. The correct answer (must be one of the 4 options)
4. A brief explanation (1-2 sentences)

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "explanation": "Explanation here."
  }
]

Important: Return ONLY the JSON array, no additional text.`;

        // Generate quiz using LLM - Try Ollama first, fallback to Groq
        let content;
        let usedProvider = 'unknown';

        if (USE_OLLAMA) {
            try {
                console.log(`🤖 Calling Ollama (${OLLAMA_MODEL}) for quiz generation...`);
                const ollamaResponse = await ollama.chat({
                    model: OLLAMA_MODEL,
                    messages: [{ role: 'user', content: prompt }],
                    options: {
                        temperature: 0.7,
                        num_predict: 4000
                    }
                });
                content = ollamaResponse.message.content;
                usedProvider = 'Ollama (local)';
                console.log('✅ Ollama quiz generated');
            } catch (ollamaError) {
                console.warn('⚠️  Ollama failed, falling back to Groq:', ollamaError.message);
                // Fallback to Groq
                const completion = await groq.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.7,
                    max_tokens: 4000
                });
                content = completion.choices[0]?.message?.content || '[]';
                usedProvider = 'Groq (fallback)';
                console.log('✅ Groq fallback quiz generated');
            }
        } else {
            // Use Groq directly if Ollama is disabled
            console.log('🤖 Calling Groq for quiz generation...');
            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 4000
            });
            content = completion.choices[0]?.message?.content || '[]';
            usedProvider = 'Groq';
            console.log('✅ Groq quiz generated');
        }

        console.log(`📡 LLM Provider: ${usedProvider}`);

        // Clean up response
        content = content.trim();
        if (content.startsWith('```json')) {
            content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (content.startsWith('```')) {
            content = content.replace(/```\n?/g, '');
        }

        const questionsData = JSON.parse(content);

        if (!Array.isArray(questionsData) || questionsData.length === 0) {
            throw new Error('Invalid AI response format');
        }

        const quiz = await Quiz.create({
            user: req.user._id,
            topic,
            subject: subject || topic,
            difficulty,
            questions: questionsData.map(q => ({
                type: 'mcq',
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                points: difficulty === 'easy' ? 5 : difficulty === 'hard' ? 15 : 10
            })),
            generatedBy: 'ai'
        });

        return res.status(201).json({
            quizId: quiz._id,
            topic: quiz.topic,
            difficulty: quiz.difficulty,
            questionCount: quiz.questions.length,
            questions: quiz.questions.map(q => ({
                id: q._id,
                type: q.type,
                question: q.question,
                options: q.options,
                points: q.points
            }))
        });
    } catch (error) {
        console.error('Quiz generation error:', error);
        return res.status(500).json({ message: 'Failed to generate quiz', error: error.message });
    }
});

// @route   POST /api/quizzes/:id/submit
router.post('/:id/submit', protect, async (req, res) => {
    const { answers, timeSpent } = req.body;

    try {
        console.log('Quiz submission:', { quizId: req.params.id, answers, timeSpent });

        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Handle both formats: {questionId, userAnswer}[] or string[]
        let correctCount = 0;
        let totalPoints = 0;
        const answerDetails = quiz.questions.map((q, idx) => {
            // Support both answer formats
            const answer = answers[idx];
            const userAnswer = typeof answer === 'object' ? answer.userAnswer : answer;
            const isCorrect = userAnswer === q.correctAnswer;

            if (isCorrect) {
                correctCount++;
                totalPoints += q.points;
            }

            return {
                questionId: q._id.toString(),
                userAnswer: userAnswer || '',
                isCorrect,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation
            };
        });

        const maxPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
        const percentage = Math.round((totalPoints / maxPoints) * 100);

        // Calculate XP
        const multiplier = { easy: 1, medium: 1.5, hard: 2 }[quiz.difficulty] || 1;
        const baseXP = correctCount * 10;
        const speedBonus = timeSpent < (quiz.questions.length * 30) ? 5 : 0;
        const perfectBonus = percentage === 100 ? 50 : 0;
        const xpEarned = Math.round((baseXP * multiplier) + speedBonus + perfectBonus);

        console.log('Score:', { correctCount, percentage, xpEarned });

        // Save score
        const quizScore = await QuizScore.create({
            user: req.user._id,
            quizId: quiz._id.toString(),
            topic: quiz.topic,
            subject: quiz.subject,
            difficulty: quiz.difficulty,
            questionTypes: ['mcq'],
            totalQuestions: quiz.questions.length,
            correctAnswers: correctCount,
            score: totalPoints,
            percentage,
            timeSpent,
            answers: answerDetails.map(a => ({
                questionId: a.questionId,
                userAnswer: a.userAnswer,
                isCorrect: a.isCorrect
            })),
            xpEarned
        });

        // Update quiz stats
        quiz.timesAttempted += 1;
        quiz.averageScore = ((quiz.averageScore * (quiz.timesAttempted - 1)) + percentage) / quiz.timesAttempted;
        await quiz.save();

        // Update user XP
        try {
            const User = (await import('../models/User.js')).default;
            const user = await User.findById(req.user._id);
            if (user) {
                user.xp = (user.xp || 0) + xpEarned;
                user.level = Math.floor(user.xp / 1000) + 1;
                await user.save();
            }
        } catch (err) {
            console.error('XP update failed:', err);
        }

        return res.json({
            score: {
                percentage,
                correctCount,
                totalQuestions: quiz.questions.length
            },
            results: answerDetails,
            xpEarned
        });
    } catch (error) {
        console.error('Quiz submission error:', error);
        return res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/quizzes/history
router.get('/history', protect, async (req, res) => {
    try {
        const scores = await QuizScore.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        return res.json(scores);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

export default router;
