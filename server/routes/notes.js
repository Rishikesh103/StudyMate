import express from 'express';
import Note from '../models/Note.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/notes
// @desc    Get all user notes
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { subject, tag, search } = req.query;

        const query = { user: req.user._id };

        if (subject) query.subject = subject;
        if (tag) query.tags = tag;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const notes = await Note.find(query)
            .sort({ isPinned: -1, createdAt: -1 });

        return res.json(notes);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/notes
// @desc    Create note
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { title, content, subject, topic, tags, roadmapId, topicId, color } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content required' });
        }

        const note = await Note.create({
            user: req.user._id,
            title,
            content,
            subject,
            topic,
            tags: tags || [],
            roadmapId,
            topicId,
            color: color || 'default'
        });

        return res.status(201).json(note);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/notes/:id
// @desc    Update note
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        return res.json(note);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/notes/:id
// @desc    Delete note
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        return res.json({ success: true, message: 'Note deleted' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/notes/:id/pin
// @desc    Toggle pin status
// @access  Private
router.put('/:id/pin', protect, async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        note.isPinned = !note.isPinned;
        await note.save();

        return res.json(note);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

export default router;
