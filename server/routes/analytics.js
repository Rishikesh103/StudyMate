import express from 'express';
import StudySession from '../models/StudySession.js';
import QuizScore from '../models/QuizScore.js';
import ChatHistory from '../models/ChatHistory.js';
import { protect } from '../middleware/authMiddleware.js';
import { generateRAGInsights } from '../utils/ragInsights.js';
import { answerStudyQuestion } from '../utils/studyChat.js';

const router = express.Router();

// ==========================================
//  NEW CHAT ROUTES
// ==========================================

// @route   GET /api/analytics/chat/history
// @desc    Get persistent chat history
// @access  Private
router.get('/chat/history', protect, async (req, res) => {
    try {
        const history = await ChatHistory.findOne({ userId: req.user._id });
        res.json(history ? history.messages : []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/analytics/chat
// @desc    RAG-powered chat
// @access  Private
router.post('/chat', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { question } = req.body;

        if (!question) return res.status(400).json({ message: 'Question required' });

        const result = await answerStudyQuestion(userId, question);

        res.json(result);
    } catch (error) {
        console.error('Chat Route Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
//  EXISTING DASHBOARD ROUTES
// ==========================================

// @route   GET /api/analytics/dashboard
// @desc    Get comprehensive dashboard analytics for user
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const now = new Date();

        // Get all user's study sessions and quiz scores
        const allSessions = await StudySession.find({ user: userId }).sort({ createdAt: -1 });
        const allQuizzes = await QuizScore.find({ user: userId }).sort({ createdAt: -1 });

        // Calculate date ranges
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Filter sessions by time period
        const todaySessions = allSessions.filter(s => new Date(s.createdAt) >= today);
        const weekSessionsArray = allSessions.filter(s => new Date(s.createdAt) >= weekAgo);

        // Calculate total study time (in minutes)
        const totalStudyTime = allSessions.reduce((sum, s) => sum + s.duration, 0);
        const weekStudyTime = weekSessionsArray.reduce((sum, s) => sum + s.duration, 0);
        const todayStudyTime = todaySessions.reduce((sum, s) => sum + s.duration, 0);

        // Calculate sessions count
        const totalSessions = allSessions.length;
        const weekSessionsCount = weekSessionsArray.length;

        // Calculate focus score
        const avgSessionLength = totalSessions > 0 ? totalStudyTime / totalSessions : 0;
        const focusScore = Math.min(100, Math.round((avgSessionLength / 60) * 100));

        // Calculate study streak
        let streak = 0;
        let currentDate = new Date(today);

        while (true) {
            const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

            const hasSession = allSessions.some(s => {
                const sessionDate = new Date(s.createdAt);
                return sessionDate >= dayStart && sessionDate < dayEnd;
            });

            if (hasSession) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Daily goal progress
        const dailyGoal = 120;
        const dailyProgress = Math.min(100, Math.round((todayStudyTime / dailyGoal) * 100));

        // Weekly progress chart
        const weeklyProgress = [];
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

            const dayMinutes = allSessions
                .filter(s => {
                    const sessionDate = new Date(s.createdAt);
                    return sessionDate >= dayStart && sessionDate < dayEnd;
                })
                .reduce((sum, s) => sum + s.duration, 0);

            weeklyProgress.push({
                day: days[date.getDay()],
                minutes: dayMinutes,
                date: dayStart.toISOString()
            });
        }

        // Subject breakdown
        const subjectStats = {};
        allSessions.forEach(session => {
            if (!subjectStats[session.subject]) {
                subjectStats[session.subject] = {
                    totalMinutes: 0,
                    sessionCount: 0
                };
            }
            subjectStats[session.subject].totalMinutes += session.duration;
            subjectStats[session.subject].sessionCount += 1;
        });

        const subjectBreakdown = Object.entries(subjectStats).map(([subject, stats]) => ({
            subject,
            minutes: stats.totalMinutes,
            sessions: stats.sessionCount,
            percentage: totalStudyTime > 0 ? Math.round((stats.totalMinutes / totalStudyTime) * 100) : 0
        }));

        // Recent sessions (FIXED: Added .toString() to ID)
        const recentSessions = allSessions.slice(0, 5).map(s => ({
            id: s._id.toString(), // <--- FIXED HERE
            subject: s.subject,
            topic: s.topic || 'General',
            duration: s.duration,
            date: s.createdAt,
            mood: s.mood
        }));

        // Mood analysis
        const moodCounts = {};
        weekSessionsArray.forEach(s => {
            if (s.mood) {
                moodCounts[s.mood] = (moodCounts[s.mood] || 0) + 1;
            }
        });

        // Quiz analytics
        const totalQuizzes = allQuizzes.length;
        const weekQuizzes = allQuizzes.filter(q => new Date(q.createdAt) >= weekAgo);
        const avgQuizScore = totalQuizzes > 0
            ? Math.round(allQuizzes.reduce((sum, q) => sum + q.percentage, 0) / totalQuizzes)
            : 0;
        const totalXP = allQuizzes.reduce((sum, q) => sum + (q.xpEarned || 0), 0);

        const recentQuizzes = allQuizzes.slice(0, 5).map(q => ({
            id: q._id,
            topic: q.topic,
            subject: q.subject,
            score: q.percentage,
            correctAnswers: q.correctAnswers,
            totalQuestions: q.totalQuestions,
            xpEarned: q.xpEarned || 0,
            date: q.createdAt,
            difficulty: q.difficulty
        }));

        // Heatmap
        const heatmapData = [];
        for (let i = 364; i >= 0; i--) {
            const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

            const dayMinutes = allSessions
                .filter(s => {
                    const sessionDate = new Date(s.createdAt);
                    return sessionDate >= dayStart && sessionDate < dayEnd;
                })
                .reduce((sum, s) => sum + s.duration, 0);

            let level = 0;
            if (dayMinutes > 0) level = 1;
            if (dayMinutes >= 30) level = 2;
            if (dayMinutes >= 60) level = 3;
            if (dayMinutes >= 120) level = 4;

            heatmapData.push({
                date: dayStart.toISOString(),
                count: dayMinutes,
                level
            });
        }

        return res.json({
            stats: {
                totalStudyTime: Math.round(totalStudyTime),
                weekStudyTime: Math.round(weekStudyTime),
                todayStudyTime: Math.round(todayStudyTime),
                totalSessions,
                weekSessionsCount,
                focusScore,
                streak,
                dailyGoal,
                dailyProgress,
                totalQuizzes,
                weekQuizzes: weekQuizzes.length,
                avgQuizScore,
                totalXP
            },
            weeklyProgress,
            subjectBreakdown,
            recentSessions,
            recentQuizzes,
            heatmapData,
            moodAnalysis: {
                counts: moodCounts,
                weekSessions: weekSessionsCount
            }
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: error.message });
    }
});

// In-memory cache for AI insights
const insightsCache = new Map();

// @route   GET /api/analytics/insights
// @desc    Get AI-generated study insights
// @access  Private
router.get('/insights', protect, async (req, res) => {
    try {
        const userId = req.user._id.toString();

        const cached = insightsCache.get(userId);
        if (cached && Date.now() - cached.timestamp < 3600000) {
            return res.json({
                insights: cached.data,
                generatedAt: new Date(cached.timestamp).toISOString(),
                cached: true
            });
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const allSessions = await StudySession.find({ user: userId }).sort({ createdAt: -1 });
        const allQuizzes = await QuizScore.find({ user: userId }).sort({ createdAt: -1 });
        const weekSessionsArray = allSessions.filter(s => new Date(s.createdAt) >= weekAgo);
        const todaySessions = allSessions.filter(s => new Date(s.createdAt) >= today);

        const totalStudyTime = allSessions.reduce((sum, s) => sum + s.duration, 0);
        const weekStudyTime = weekSessionsArray.reduce((sum, s) => sum + s.duration, 0);
        const todayStudyTime = todaySessions.reduce((sum, s) => sum + s.duration, 0);
        const totalSessions = allSessions.length;
        const avgSessionLength = totalSessions > 0 ? totalStudyTime / totalSessions : 0;
        const focusScore = Math.min(100, Math.round((avgSessionLength / 60) * 100));

        let streak = 0;
        let currentDate = new Date(today);
        while (true) {
            const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            const hasSession = allSessions.some(s => {
                const sessionDate = new Date(s.createdAt);
                return sessionDate >= dayStart && sessionDate < dayEnd;
            });
            if (hasSession) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        const dailyGoal = 120;
        const dailyProgress = Math.min(100, Math.round((todayStudyTime / dailyGoal) * 100));

        const totalQuizzes = allQuizzes.length;
        const weekQuizzes = allQuizzes.filter(q => new Date(q.createdAt) >= weekAgo);
        const avgQuizScore = totalQuizzes > 0
            ? Math.round(allQuizzes.reduce((sum, q) => sum + q.percentage, 0) / totalQuizzes)
            : 0;
        const totalXP = allQuizzes.reduce((sum, q) => sum + (q.xpEarned || 0), 0);

        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const weeklyProgress = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            const dayMinutes = allSessions
                .filter(s => {
                    const sessionDate = new Date(s.createdAt);
                    return sessionDate >= dayStart && sessionDate < dayEnd;
                })
                .reduce((sum, s) => sum + s.duration, 0);
            weeklyProgress.push({
                day: days[date.getDay()],
                minutes: dayMinutes,
                date: dayStart.toISOString()
            });
        }

        const subjectStats = {};
        allSessions.forEach(session => {
            if (!subjectStats[session.subject]) {
                subjectStats[session.subject] = { totalMinutes: 0, sessionCount: 0 };
            }
            subjectStats[session.subject].totalMinutes += session.duration;
            subjectStats[session.subject].sessionCount += 1;
        });

        const subjectBreakdown = Object.entries(subjectStats)
            .map(([subject, stats]) => ({
                subject,
                minutes: stats.totalMinutes,
                sessions: stats.sessionCount,
                percentage: totalStudyTime > 0 ? Math.round((stats.totalMinutes / totalStudyTime) * 100) : 0
            }))
            .sort((a, b) => b.minutes - a.minutes);

        // Recent sessions (FIXED: Added .toString() to ID)
        const recentSessions = allSessions.slice(0, 5).map(s => ({
            id: s._id.toString(), // <--- FIXED HERE
            subject: s.subject,
            topic: s.topic || 'General',
            duration: s.duration,
            date: s.createdAt,
            mood: s.mood
        }));

        const analyticsData = {
            stats: {
                totalStudyTime,
                weekStudyTime,
                todayStudyTime,
                totalSessions,
                focusScore,
                streak,
                dailyGoal,
                dailyProgress,
                totalQuizzes,
                weekQuizzes: weekQuizzes.length,
                avgQuizScore,
                totalXP
            },
            weeklyProgress,
            subjectBreakdown,
            recentSessions
        };

        const insights = await generateRAGInsights(analyticsData);

        insightsCache.set(userId, {
            data: insights,
            timestamp: Date.now()
        });

        res.json({
            insights,
            generatedAt: new Date().toISOString(),
            cached: false
        });

    } catch (error) {
        console.error('Insights error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/analytics/heatmap
// @desc    Get 365-day GitHub-style contribution heatmap data
// @access  Private
router.get('/heatmap', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const allSessions = await StudySession.find({ user: userId }).sort({ createdAt: 1 });
        const heatmapData = [];

        for (let i = 364; i >= 0; i--) {
            const targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() - i);
            targetDate.setHours(0, 0, 0, 0);

            const nextDate = new Date(targetDate);
            nextDate.setDate(nextDate.getDate() + 1);

            const dailyMinutes = allSessions
                .filter(session => {
                    const sessionDate = new Date(session.createdAt);
                    return sessionDate >= targetDate && sessionDate < nextDate;
                })
                .reduce((sum, session) => sum + session.duration, 0);

            let level = 0;
            if (dailyMinutes > 0) level = 1;
            if (dailyMinutes >= 30) level = 2;
            if (dailyMinutes >= 60) level = 3;
            if (dailyMinutes >= 120) level = 4;

            heatmapData.push({
                date: targetDate.toISOString().split('T')[0],
                minutes: dailyMinutes,
                level: level
            });
        }

        res.json(heatmapData);

    } catch (error) {
        console.error('Heatmap error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;