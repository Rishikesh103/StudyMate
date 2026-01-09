import { pipeline } from '@xenova/transformers';

let embedder = null;

/**
 * Initialize the embedding model (singleton)
 * Uses all-MiniLM-L6-v2 (384-dimensional embeddings)
 */
export async function initEmbedder() {
    if (!embedder) {
        console.log('🤖 Loading embedding model (all-MiniLM-L6-v2)...');
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('✅ Embedding model loaded');
    }
    return embedder;
}

/**
 * Generate embedding vector for text
 * @param {string} text - Input text to embed
 * @returns {Promise<number[]>} - 384-dimensional embedding vector
 */
export async function generateEmbedding(text) {
    if (!text || text.trim().length === 0) {
        throw new Error('Cannot generate embedding for empty text');
    }

    const model = await initEmbedder();
    const output = await model(text, { pooling: 'mean', normalize: true });

    // Convert to regular array
    return Array.from(output.data);
}

/**
 * Calculate cosine similarity between two embedding vectors
 * Assumes vectors are already normalized
 * @param {number[]} vecA - First embedding vector
 * @param {number[]} vecB - Second embedding vector
 * @returns {number} - Similarity score (0-1)
 */
export function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
        throw new Error('Invalid vectors for similarity calculation');
    }

    // Dot product (vectors are pre-normalized)
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    return dotProduct;
}

export default { initEmbedder, generateEmbedding, cosineSimilarity };
