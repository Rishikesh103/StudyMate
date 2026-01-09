import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },
    topic: {
        type: String,
        trim: true
    },
    subtopic: {
        type: String,
        trim: true
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: [1, 'Duration must be at least 1 minute']
    },
    difficulty: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    cognitiveLoad: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    mood: {
        type: String,
        enum: ['great', 'good', 'neutral', 'tired', 'stressed', 'productive', 'distracted', 'focused', ''],
        default: 'neutral'
    },
    // New fields for future features
    focusScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    retentionTested: {
        type: Boolean,
        default: false
    },
    tags: {
        type: [String],
        default: []
    },
    pomodoroCount: {
        type: Number,
        min: 0,
        default: 0
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

// Compound indexes for common query patterns
studySessionSchema.index({ user: 1, createdAt: -1 });           // User's recent sessions
studySessionSchema.index({ user: 1, subject: 1, createdAt: -1 }); // Subject-specific history
studySessionSchema.index({ user: 1, topic: 1 });                // Topic lookup for roadmap
studySessionSchema.index({ createdAt: -1 });                    // Global recent sessions (admin)
studySessionSchema.index({ user: 1, isArchived: 1 });           // Active vs archived sessions

const StudySession = mongoose.model('StudySession', studySessionSchema);
export default StudySession;
