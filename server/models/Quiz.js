import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['mcq', 'true-false', 'short-answer'],
        required: true
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    options: [{
        type: String,
        trim: true
    }],
    correctAnswer: {
        type: String,
        required: true,
        trim: true
    },
    explanation: {
        type: String,
        trim: true
    },
    points: {
        type: Number,
        default: 10
    }
});

const quizSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    topic: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        trim: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    questions: [questionSchema],
    generatedBy: {
        type: String,
        enum: ['ai', 'manual'],
        default: 'ai'
    },
    timesAttempted: {
        type: Number,
        default: 0
    },
    averageScore: {
        type: Number,
        default: 0
    },
    isPublic: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
quizSchema.index({ user: 1, createdAt: -1 });
quizSchema.index({ topic: 1, difficulty: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
