import express from 'express';
import RevisionPlan from '../models/RevisionPlan.js';
import Roadmap from '../models/Roadmap.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/revision/upcoming
// @desc    Get upcoming revisions (next 7 days)
// @access  Private
router.get('/upcoming', protect, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const revisions = await RevisionPlan.getUpcoming(req.user._id, days);

        return res.json(revisions);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/revision/today
// @desc    Get today's revisions
// @access  Private
router.get('/today', protect, async (req, res) => {
    try {
        const revisions = await RevisionPlan.getToday(req.user._id);
        return res.json(revisions);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/revision/overdue
// @desc    Get overdue revisions
// @access  Private
router.get('/overdue', protect, async (req, res) => {
    try {
        const revisions = await RevisionPlan.getOverdue(req.user._id);
        return res.json(revisions);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/revision/stats
// @desc    Get revision statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
    try {
        const revisions = await RevisionPlan.find({ user: req.user._id });

        const total = revisions.length;
        const mastered = revisions.filter(r => r.mastered).length;
        const overdue = revisions.filter(r =>
            r.nextReview < new Date() && !r.mastered && r.status !== 'skipped'
        ).length;

        // Calculate compliance (reviews done on time)
        const reviewedOnTime = revisions.filter(r => {
            if (r.reviewHistory.length === 0) return false;
            const lastReview = r.reviewHistory[r.reviewHistory.length - 1];
            return lastReview.date <= r.nextReview;
        }).length;

        const compliance = total > 0 ? Math.round((reviewedOnTime / total) * 100) : 0;

        // Average quality score
        const allQualities = revisions.flatMap(r => r.reviewHistory.map(h => h.quality));
        const avgQuality = allQualities.length > 0
            ? (allQualities.reduce((a, b) => a + b, 0) / allQualities.length).toFixed(1)
            : 0;

        // Streak calculation
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let streak = 0;
        let checkDate = new Date(today);

        while (true) {
            const dayStart = new Date(checkDate);
            const dayEnd = new Date(checkDate);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const hasReview = revisions.some(r =>
                r.reviewHistory.some(h => h.date >= dayStart && h.date < dayEnd)
            );

            if (!hasReview) break;

            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }

        return res.json({
            total,
            mastered,
            overdue,
            active: total - mastered,
            compliance,
            avgQuality: parseFloat(avgQuality),
            streak,
            totalReviews: allQualities.length
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/revision/add
// @desc    Add topic to revision schedule
// @access  Private
router.post('/add', protect, async (req, res) => {
    try {
        const { subject, topicName, topicId, roadmapId, priority } = req.body;

        if (!subject || !topicName) {
            return res.status(400).json({ message: 'Subject and topic name are required' });
        }

        // Check if already exists
        const existing = await RevisionPlan.findOne({
            user: req.user._id,
            subject,
            topicName,
            mastered: false
        });

        if (existing) {
            return res.status(400).json({ message: 'Topic already in revision schedule' });
        }

        // Create revision plan with initial schedule (review tomorrow)
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + 1);

        const revisionPlan = await RevisionPlan.create({
            user: req.user._id,
            roadmapId,
            subject,
            topicName,
            topicId,
            nextReview,
            priority: priority || 'medium',
            addedFrom: roadmapId ? 'roadmap' : 'manual'
        });

        return res.status(201).json(revisionPlan);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/revision/:id/review
// @desc    Mark revision as reviewed with quality rating
// @access  Private
router.post('/:id/review', protect, async (req, res) => {
    try {
        const { quality, timeSpent, notes } = req.body;

        if (quality === undefined || quality < 0 || quality > 5) {
            return res.status(400).json({ message: 'Quality rating (0-5) is required' });
        }

        const revision = await RevisionPlan.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!revision) {
            return res.status(404).json({ message: 'Revision plan not found' });
        }

        // Add to review history
        revision.reviewHistory.push({
            date: new Date(),
            quality: parseInt(quality),
            timeSpent: timeSpent || 0,
            notes: notes || ''
        });

        // Calculate next review using SM-2
        const scheduleData = revision.calculateNextReview(quality);

        revision.easinessFactor = scheduleData.easinessFactor;
        revision.interval = scheduleData.interval;
        revision.repetitionNumber = scheduleData.repetitionNumber;
        revision.nextReview = scheduleData.nextReview;
        revision.lastReviewed = new Date();
        revision.status = 'reviewed';

        // Check if mastered
        revision.checkMastery();

        await revision.save();

        return res.json({
            success: true,
            revision,
            message: revision.mastered
                ? 'Congratulations! Topic mastered! 🎉'
                : `Next review scheduled for ${scheduleData.nextReview.toDateString()}`
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/revision/:id/reschedule
// @desc    Manually reschedule a revision
// @access  Private
router.put('/:id/reschedule', protect, async (req, res) => {
    try {
        const { nextReview } = req.body;

        if (!nextReview) {
            return res.status(400).json({ message: 'Next review date is required' });
        }

        const revision = await RevisionPlan.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { nextReview: new Date(nextReview) },
            { new: true }
        );

        if (!revision) {
            return res.status(404).json({ message: 'Revision plan not found' });
        }

        return res.json(revision);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/revision/:id
// @desc    Delete a revision plan
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const revision = await RevisionPlan.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!revision) {
            return res.status(404).json({ message: 'Revision plan not found' });
        }

        return res.json({ success: true, message: 'Revision plan deleted' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/revision/calendar/:year/:month
// @desc    Get calendar view of revisions for a month
// @access  Private
router.get('/calendar/:year/:month', protect, async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month) - 1; // 0-indexed

        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        endDate.setHours(23, 59, 59);

        const revisions = await RevisionPlan.find({
            user: req.user._id,
            mastered: false,
            nextReview: { $gte: startDate, $lte: endDate }
        }).sort({ nextReview: 1 });

        // Group by date
        const calendar = {};
        revisions.forEach(rev => {
            const dateKey = rev.nextReview.toISOString().split('T')[0];
            if (!calendar[dateKey]) {
                calendar[dateKey] = [];
            }
            calendar[dateKey].push(rev);
        });

        return res.json(calendar);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/revision/bulk-add-from-roadmap
// @desc    Add all incomplete topics from a roadmap to revision schedule
// @access  Private
router.post('/bulk-add-from-roadmap', protect, async (req, res) => {
    try {
        const { roadmapId } = req.body;

        if (!roadmapId) {
            return res.status(400).json({ message: 'Roadmap ID is required' });
        }

        const roadmap = await Roadmap.findOne({
            _id: roadmapId,
            user: req.user._id
        });

        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        let added = 0;
        const errors = [];

        for (const subject of roadmap.subjects) {
            for (const topic of subject.topics) {
                if (!topic.isCompleted) {
                    try {
                        // Check if already in revision schedule
                        const existing = await RevisionPlan.findOne({
                            user: req.user._id,
                            subject: subject.name,
                            topicName: topic.name,
                            mastered: false
                        });

                        if (!existing) {
                            const nextReview = new Date();
                            nextReview.setDate(nextReview.getDate() + 1);

                            await RevisionPlan.create({
                                user: req.user._id,
                                roadmapId,
                                subject: subject.name,
                                topicName: topic.name,
                                topicId: topic._id.toString(),
                                nextReview,
                                addedFrom: 'roadmap'
                            });
                            added++;
                        }
                    } catch (err) {
                        errors.push(`${subject.name} - ${topic.name}: ${err.message}`);
                    }
                }
            }
        }

        return res.json({
            success: true,
            added,
            message: `Added ${added} topics to revision schedule`,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

export default router;
