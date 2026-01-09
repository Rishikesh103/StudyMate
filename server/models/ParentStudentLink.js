import mongoose from 'mongoose';

const parentStudentLinkSchema = new mongoose.Schema({
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'rejected'],
        default: 'active',
    },
}, {
    timestamps: true,
});

const ParentStudentLink = mongoose.model('ParentStudentLink', parentStudentLinkSchema);
export default ParentStudentLink;
