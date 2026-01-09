import express from 'express';
import User from '../models/User.js';
import Roadmap from '../models/Roadmap.js';
import StudySession from '../models/StudySession.js';
import QuizScore from '../models/QuizScore.js';
import ParentFeedback from '../models/ParentFeedback.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import { parseDocument } from '../utils/documentParser.js';
import Groq from 'groq-sdk';

import dotenv from 'dotenv';
dotenv.config();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const router = express.Router();

// @route   GET /api/users/stats
// @desc    Get aggregated stats for current user (Study Sessions + Quizzes)
// @access  Private
router.get('/stats', protect, async (req, res) => {
    try {
        const sessions = await StudySession.find({ user: req.user._id }).sort({ createdAt: -1 });
        const quizzes = await QuizScore.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json({ sessions, quizzes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/users/students
// @desc    Get all students (for teachers)
// @access  Private
router.get('/students', protect, async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('name _id avatar');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/users/student/:id
// @desc    Get specific student data (for parent/teacher)
// @access  Private
router.get('/student/:id', protect, async (req, res) => {
    try {
        const sessions = await StudySession.find({ user: req.params.id }).sort({ createdAt: -1 });
        const quizzes = await QuizScore.find({ user: req.params.id }).sort({ createdAt: -1 });
        res.json({ sessions, quizzes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/users/linked-students
// @desc    Get linked students for parent
// @access  Private
router.get('/linked-students', protect, async (req, res) => {
    try {
        const parent = await User.findById(req.user._id).populate('linkedStudents', 'name _id avatar');
        res.json(parent.linkedStudents || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/users/link-student
// @desc    Link student to parent
// @access  Private
router.post('/link-student', protect, async (req, res) => {
    const { studentId } = req.body;
    try {
        const parent = await User.findById(req.user._id);
        if (!parent.linkedStudents.includes(studentId)) {
            parent.linkedStudents.push(studentId);
            await parent.save();
        }
        res.json(parent.linkedStudents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/users/feedback
// @desc    Send feedback to student
// @access  Private
router.post('/feedback', protect, async (req, res) => {
    const { studentId, feedback } = req.body;
    try {
        const newFeedback = await ParentFeedback.create({
            parent: req.user._id,
            student: studentId,
            message: feedback,
        });
        res.status(201).json(newFeedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/users/roadmap
// @desc    Update user study roadmap
// @access  Private
router.put('/roadmap', protect, async (req, res) => {
    const { roadmap } = req.body;
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.roadmap = roadmap || '';
            await user.save();
            return res.json({ success: true, roadmap: user.roadmap });
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});


// @route   DELETE /api/users/roadmap/:roadmapId
// @desc    Delete a specific roadmap
// @access  Private
router.delete('/roadmap/:roadmapId', protect, async (req, res) => {
    try {
        const roadmap = await Roadmap.findOneAndDelete({
            _id: req.params.roadmapId,
            user: req.user._id
        });

        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        return res.json({ success: true, message: 'Roadmap deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});


// @route   GET /api/users/roadmap/all
// @desc    Get all user roadmaps
// @access  Private
router.get('/roadmap/all', protect, async (req, res) => {
    try {
        const roadmaps = await Roadmap.find({ user: req.user._id }).sort({ createdAt: -1 });
        return res.json(roadmaps);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/users/roadmap/:roadmapId/progress
// @desc    Update topic completion status
// @access  Private
router.put('/roadmap/:roadmapId/progress', protect, async (req, res) => {
    const { subjectId, topicId, isCompleted } = req.body;
    try {
        const roadmap = await Roadmap.findOne({
            _id: req.params.roadmapId,
            user: req.user._id
        });

        if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });

        const subject = roadmap.subjects.id(subjectId);
        if (subject) {
            const topic = subject.topics.id(topicId);
            if (topic) {
                topic.isCompleted = isCompleted;

                // Recalculate subject progress
                const completedTopics = subject.topics.filter(t => t.isCompleted).length;
                subject.progress = Math.round((completedTopics / subject.topics.length) * 100);

                // Recalculate overall progress
                const totalSubjects = roadmap.subjects.length;
                const totalSubjectProgress = roadmap.subjects.reduce((acc, sub) => acc + sub.progress, 0);
                roadmap.overallProgress = Math.round(totalSubjectProgress / totalSubjects);

                await roadmap.save();
                return res.json({ success: true, roadmap });
            } else {
                return res.status(404).json({ message: "Topic not found" });
            }
        } else {
            return res.status(404).json({ message: "Subject not found" });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/users/roadmap/scan
// @desc    Scan PDF/Text and generate structured roadmap via AI
// @access  Private
router.post('/roadmap/scan', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log(`📂 Processing file: ${req.file.originalname}`);

        // 1. Extract Text
        const text = await parseDocument(req.file.buffer, req.file.mimetype);

        if (!text || text.length < 50) {
            return res.status(400).json({ message: 'Could not extract enough text from this file.' });
        }

        // 2. Generate Roadmap with AI
        console.log('🤖 Generating structured roadmap from text...');

        const prompt = `
            You are an expert educational curriculum developer. 
            Analyze the following document text and extract a structured study roadmap.
            
            Return ONLY valid JSON with this structure:
            {
                "subjects": [
                    {
                        "name": "Subject Name (e.g. Mathematics)",
                        "topics": [
                            { "name": "Topic Name (e.g. Calculus)" },
                            { "name": "Topic Name (e.g. Algebra)" }
                        ]
                    }
                ]
            }

            If the text implies a single subject, create one subject entry. 
            Ensure topic names are concise.
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: prompt
                },
                {
                    role: 'user',
                    content: `Document Text:\n${text.substring(0, 15000)}`
                }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' }
        });

        const jsonContent = completion.choices[0]?.message?.content;

        if (!jsonContent) {
            throw new Error('Failed to generate roadmap JSON.');
        }

        const parsedData = JSON.parse(jsonContent);

        // 3. Generate title from filename (remove extension)
        const title = req.file.originalname.replace(/\.(pdf|txt)$/i, '');

        // 4. Save to Database (always create new)
        const roadmap = await Roadmap.create({
            user: req.user._id,
            title,
            subjects: parsedData.subjects,
            generatedFrom: 'upload'
        });

        return res.json({ success: true, roadmap });

    } catch (error) {
        console.error('Scan error:', error);
        return res.status(500).json({ message: error.message });
    }
});

export default router;
