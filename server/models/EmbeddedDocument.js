import mongoose from 'mongoose';

/**
 * MongoDB schema for storing embedded documents with vector embeddings
 * Supports semantic search for RAG system
 */
const embeddedDocumentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sourceType: {
        type: String,
        // UPDATE: Added 'note', 'revision' to the allowed list
        enum: ['quiz', 'quizScore', 'studySession', 'roadmap', 'insight', 'note', 'revision'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    embedding: {
        type: [Number],
        required: true
    },
    metadata: {
        // Universal metadata fields
        title: String,
        subject: String,
        topic: String,
        difficulty: String,
        score: Number,
        xp: Number,
        timestamp: Date,
        duration: Number,
        status: String,
        priority: String
    },
    sourceId: {
        type: String
    }
}, {
    timestamps: true
});

// Compound indexes for efficient filtering
embeddedDocumentSchema.index({ userId: 1, sourceType: 1 });
embeddedDocumentSchema.index({ userId: 1, createdAt: -1 });

const EmbeddedDocument = mongoose.model('EmbeddedDocument', embeddedDocumentSchema);
export default EmbeddedDocument;