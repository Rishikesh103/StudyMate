import mongoose from 'mongoose';

const reviewHistorySchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    quality: {
        type: Number,
        min: 0,
        max: 5,
        required: true
    },
    timeSpent: {
        type: Number, // seconds
        default: 0
    },
    notes: {
        type: String,
        maxlength: 500
    }
});

const revisionPlanSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    roadmapId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Roadmap'
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    topicName: {
        type: String,
        required: true,
        trim: true
    },
    topicId: {
        type: String
    },

    // Spaced Repetition (SM-2 Algorithm)
    lastReviewed: {
        type: Date,
        default: null
    },
    nextReview: {
        type: Date,
        required: true
    },
    repetitionNumber: {
        type: Number,
        default: 0,
        min: 0
    },
    easinessFactor: {
        type: Number,
        default: 2.5,
        min: 1.3 // SM-2 minimum
    },
    interval: {
        type: Number, // Days until next review
        default: 1,
        min: 1
    },

    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'skipped', 'mastered'],
        default: 'pending'
    },

    // History
    reviewHistory: [reviewHistorySchema],

    // Metadata
    addedFrom: {
        type: String,
        enum: ['manual', 'roadmap', 'quiz', 'ai_chat'],
        default: 'manual'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },

    // Auto-archive mastered topics
    mastered: {
        type: Boolean,
        default: false
    },
    masteredAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
revisionPlanSchema.index({ user: 1, nextReview: 1 });
revisionPlanSchema.index({ user: 1, status: 1 });
revisionPlanSchema.index({ user: 1, subject: 1 });
revisionPlanSchema.index({ nextReview: 1, status: 1 });

// Methods

/**
 * SM-2 Algorithm Implementation
 * @param {Number} quality - User rating (0-5)
 * @returns {Object} Updated scheduling parameters
 */
revisionPlanSchema.methods.calculateNextReview = function (quality) {
    // Quality scale:
    // 0 - Complete blackout
    // 1 - Incorrect, but familiar
    // 2 - Incorrect, but easy to recall
    // 3 - Correct, but difficult
    // 4 - Correct, with hesitation
    // 5 - Perfect recall

    let { easinessFactor, interval, repetitionNumber } = this;

    // Update easiness factor (SM-2 formula)
    easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Clamp easiness factor
    if (easinessFactor < 1.3) easinessFactor = 1.3;

    // Calculate new interval
    if (quality < 3) {
        // Failed recall - restart
        repetitionNumber = 0;
        interval = 1;
    } else {
        // Successful recall
        repetitionNumber += 1;

        if (repetitionNumber === 1) {
            interval = 1;
        } else if (repetitionNumber === 2) {
            interval = 6;
        } else {
            interval = Math.round(interval * easinessFactor);
        }
    }

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    return {
        easinessFactor,
        interval,
        repetitionNumber,
        nextReview
    };
};

/**
 * Mark topic as mastered (after consistent perfect recalls)
 */
revisionPlanSchema.methods.checkMastery = function () {
    const recentReviews = this.reviewHistory.slice(-5);

    // Mastered if last 5 reviews are all quality >= 4
    if (recentReviews.length >= 5 && recentReviews.every(r => r.quality >= 4)) {
        this.mastered = true;
        this.masteredAt = new Date();
        this.status = 'mastered';
        return true;
    }

    return false;
};

// Static methods

/**
 * Get upcoming revisions for a user
 */
revisionPlanSchema.statics.getUpcoming = async function (userId, days = 7) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.find({
        user: userId,
        status: { $in: ['pending', 'reviewed'] },
        mastered: false,
        nextReview: { $lte: endDate }
    }).sort({ nextReview: 1 });
};

/**
 * Get overdue revisions
 */
revisionPlanSchema.statics.getOverdue = async function (userId) {
    return this.find({
        user: userId,
        status: { $in: ['pending', 'reviewed'] },
        mastered: false,
        nextReview: { $lt: new Date() }
    }).sort({ nextReview: 1 });
};

/**
 * Get today's revisions
 */
revisionPlanSchema.statics.getToday = async function (userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.find({
        user: userId,
        status: { $in: ['pending', 'reviewed'] },
        mastered: false,
        nextReview: { $gte: today, $lt: tomorrow }
    }).sort({ priority: -1, nextReview: 1 });
};

const RevisionPlan = mongoose.model('RevisionPlan', revisionPlanSchema);

export default RevisionPlan;
