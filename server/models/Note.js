import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        maxlength: 10000
    },
    subject: {
        type: String,
        trim: true
    },
    topic: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    roadmapId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Roadmap'
    },
    topicId: {
        type: String
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    color: {
        type: String,
        enum: ['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'],
        default: 'default'
    }
}, {
    timestamps: true
});

// Indexes
noteSchema.index({ user: 1, createdAt: -1 });
noteSchema.index({ user: 1, subject: 1 });
noteSchema.index({ user: 1, isPinned: -1, createdAt: -1 });
noteSchema.index({ tags: 1 });

const Note = mongoose.model('Note', noteSchema);

export default Note;
