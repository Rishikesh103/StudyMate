import express from 'express';
import User from '../models/User.js';
import StudySession from '../models/StudySession.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to check for admin role
const adminProtect = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

// @route   GET /api/admin/stats
// @desc    Get system-wide stats
// @access  Private/Admin
router.get('/stats', protect, adminProtect, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalSessions = await StudySession.countDocuments();

        // Calculate total study hours
        const allSessions = await StudySession.find().select('duration');
        const totalHours = Math.round(allSessions.reduce((acc, curr) => acc + curr.duration, 0) / 60);

        res.json({
            totalUsers,
            totalSessions,
            totalHours
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', protect, adminProtect, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/users/:id', protect, adminProtect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
