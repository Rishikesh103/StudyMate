import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Topic name is required'],
        trim: true,
        maxlength: [100, 'Topic name can not be more than 100 characters']
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    // Learning path enhancements
    estimatedHours: {
        type: Number,
        min: 0,
        default: 0
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', ''],
        default: ''
    },
    dueDate: {
        type: Date
    },
    completedDate: {
        type: Date
    },
    dependencies: [{
        type: String  // Topic IDs that must be completed first
    }],
    resources: [{
        title: String,
        url: String,
        type: {
            type: String,
            enum: ['pdf', 'video', 'link', 'note', '']
        }
    }],
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    }
});

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Subject name is required'],
        trim: true,
        maxlength: [100, 'Subject name can not be more than 100 characters']
    },
    progress: {
        type: Number,
        default: 0,
        min: [0, 'Progress must be at least 0'],
        max: [100, 'Progress must not exceed 100']
    },
    topics: [topicSchema]
});

const roadmapSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    subjects: [subjectSchema],
    overallProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    // Metadata
    generatedFrom: {
        type: String,  // 'ai', 'manual', 'upload'
        default: 'ai'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
roadmapSchema.index({ user: 1 });
roadmapSchema.index({ createdAt: -1 });
roadmapSchema.index({ 'subjects.name': 1 });

// Update lastUpdated on save
roadmapSchema.pre('save', async function () {
    this.lastUpdated = new Date();
});

const Roadmap = mongoose.model('Roadmap', roadmapSchema);

export default Roadmap;
