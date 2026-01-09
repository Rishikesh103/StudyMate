import mongoose from 'mongoose';

const parentFeedbackSchema = new mongoose.Schema({
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        maxlength: [500, 'Message cannot exceed 500 characters']
    },
}, {
    timestamps: true,
});

// Index for fetching feedback history between specific parent and student
parentFeedbackSchema.index({ parent: 1, student: 1, createdAt: -1 });

const ParentFeedback = mongoose.model('ParentFeedback', parentFeedbackSchema);
export default ParentFeedback;
