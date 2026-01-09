import mongoose from 'mongoose';

const quizScoreSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quizId: {
        type: String
    },
    topic: {
        type: String,
        required: [true, 'Topic is required'],
        trim: true
    },
    subject: {
        type: String,
        trim: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', ''],
        default: ''
    },
    questionTypes: [{
        type: String,
        enum: ['mcq', 'true-false', 'short-answer']
    }],
    totalQuestions: {
        type: Number,
        required: true,
        min: 1
    },
    correctAnswers: {
        type: Number,
        min: 0
    },
    score: {
        type: Number,
        required: true,
        min: 0
    },
    percentage: {
        type: Number,
        min: 0,
        max: 100
    },
    timeSpent: {
        type: Number,
        min: 0
    },
    answers: [{
        questionId: String,
        userAnswer: String,
        isCorrect: Boolean,
        timeSpent: Number
    }],
    xpEarned: {
        type: Number,
        default: 0,
        min: 0
    },
    retentionMarked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

// Calculate percentage before saving
quizScoreSchema.pre('save', async function () {
    if (this.totalQuestions > 0 && this.correctAnswers !== undefined) {
        this.percentage = Math.round((this.correctAnswers / this.totalQuestions) * 100);
    }
});

// Compound indexes for analytics
quizScoreSchema.index({ user: 1, createdAt: -1 });
quizScoreSchema.index({ user: 1, topic: 1, score: -1 });
quizScoreSchema.index({ user: 1, subject: 1 });
quizScoreSchema.index({ user: 1, difficulty: 1 });

const QuizScore = mongoose.model('QuizScore', quizScoreSchema);
export default QuizScore;

