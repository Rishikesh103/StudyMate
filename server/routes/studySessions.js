import express from 'express';
import StudySession from '../models/StudySession.js';
import Roadmap from '../models/Roadmap.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import { XP_REWARDS, checkBadges, calculateLevel } from '../utils/gamification.js';

const router = express.Router();

// @route   POST /api/study-sessions
// @desc    Log a study session
// @access  Private
router.post('/', protect, async (req, res) => {
    const { subject, duration, notes, topic, subtopic, mood, difficulty, cognitiveLoad, cognitive_load } = req.body;
    try {
        // Create study session
        const session = await StudySession.create({
            user: req.user._id,
            subject,
            topic,
            subtopic,
            duration,
            notes,
            mood,
            difficulty,
            cognitiveLoad: cognitiveLoad || cognitive_load
        });

        // Award XP and update streak
        const user = await User.findById(req.user._id);
        const xpEarned = XP_REWARDS.STUDY_SESSION + duration; // Base + 1 per minute
        user.xp += xpEarned;
        user.level = calculateLevel(user.xp);
        user.totalStudyHours += duration / 60;

        // Update streak
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastStudy = user.lastStudyDate ? new Date(user.lastStudyDate) : null;

        if (lastStudy) {
            lastStudy.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Continued streak
                user.streak += 1;
                if (user.streak > user.longestStreak) {
                    user.longestStreak = user.streak;
                }
            } else if (diffDays > 1) {
                // Broke streak
                user.streak = 1;
            }
            // If same day, don't change streak
        } else {
            // First session ever
            user.streak = 1;
            user.longestStreak = 1;
        }

        user.lastStudyDate = new Date();
        await user.save();

        // Auto-update roadmap if topic matches
        if (subject && topic) {
            try {
                const roadmap = await Roadmap.findOne({ user: req.user._id });

                if (roadmap) {
                    let updated = false;

                    // Find matching subject (case-insensitive)
                    const matchingSubject = roadmap.subjects.find(s =>
                        s.name.toLowerCase() === subject.toLowerCase()
                    );

                    if (matchingSubject) {
                        // Find matching topic (case-insensitive partial match)
                        const matchingTopic = matchingSubject.topics.find(t =>
                            t.name.toLowerCase().includes(topic.toLowerCase()) ||
                            topic.toLowerCase().includes(t.name.toLowerCase())
                        );

                        if (matchingTopic && !matchingTopic.isCompleted) {
                            // Mark topic as completed
                            matchingTopic.isCompleted = true;
                            updated = true;

                            // Recalculate subject progress
                            const completedCount = matchingSubject.topics.filter(t => t.isCompleted).length;
                            matchingSubject.progress = Math.round((completedCount / matchingSubject.topics.length) * 100);

                            // Recalculate overall progress
                            let totalTopics = 0;
                            let completedTopics = 0;
                            roadmap.subjects.forEach(subject => {
                                totalTopics += subject.topics.length;
                                completedTopics += subject.topics.filter(t => t.isCompleted).length;
                            });
                            roadmap.overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

                            await roadmap.save();
                        }
                    }
                }
            } catch (roadmapError) {
                console.error('Roadmap auto-update error:', roadmapError);
            }
        }

        // Gamification: Update user stats
        try {
            const User = (await import('../models/User.js')).default;
            const user = await User.findById(req.user._id);

            if (user) {
                user.updateStreak();
                user.totalStudyHours += duration / 60;
                const baseXP = Math.floor(duration / 15) * 10;
                const difficultyBonus = difficulty ? (difficulty - 1) * 5 : 0;
                await user.addXP(baseXP + difficultyBonus);
                await user.save();
            }
        } catch (gamificationError) {
            console.error('Gamification update error:', gamificationError);
        }

        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/study-sessions
// @desc    Get all study sessions for user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const sessions = await StudySession.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

