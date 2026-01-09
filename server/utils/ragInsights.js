/**
 * Production RAG (Retrieval-Augmented Generation) for study insights
 * Uses semantic vector embeddings via @xenova/transformers
 * LLM: Ollama (local Llama) with Groq fallback
 */

import { Ollama } from 'ollama';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import EmbeddedDocument from '../models/EmbeddedDocument.js';
import { generateEmbedding, cosineSimilarity } from './embeddings.js';

dotenv.config();

// Initialize Ollama client
const ollama = new Ollama({
    host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
});

// Groq fallback
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const USE_OLLAMA = process.env.USE_OLLAMA !== 'false'; // Default to true

/**
 * RAG-powered insights generation using vector search
 * 1. Embeds analytics context
 * 2. Retrieves semantically relevant user documents
 * 3. Generates personalized insights using Groq LLM
 */
export async function generateRAGInsights(analyticsData) {
    try {
        const { stats, weeklyProgress, subjectBreakdown, recentSessions } = analyticsData;

        console.log('🔮 Generating RAG insights for user analytics...');

        // Extract userId from recent sessions
        const userId = recentSessions[0]?.userId || recentSessions[0]?.id?.split('_')[0];

        if (!userId) {
            console.warn('⚠️ No userId found, skipping vector retrieval');
            return generateRuleBasedInsights(analyticsData);
        }

        // Build analytics summary for embedding
        const analyticsSummary = buildStudyContext(stats, weeklyProgress, subjectBreakdown);
        const query = `study insights performance analysis ${subjectBreakdown.map(s => s.subject).join(' ')} focus patterns productivity`;

        // STEP 1: RETRIEVE - Vector search for relevant user documents
        const queryEmbedding = await generateEmbedding(query);
        const docs = await EmbeddedDocument.find({ userId }).lean();

        if (docs.length === 0) {
            console.log('📋 No embedded documents found, using rule-based insights');
            return generateRuleBasedInsights(analyticsData);
        }

        // Calculate similarities
        const scored = docs.map(doc => ({
            ...doc,
            similarity: cosineSimilarity(queryEmbedding, doc.embedding)
        }));

        const relevantDocs = scored
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5)
            .filter(d => d.similarity > 0.25);

        console.log(`📊 Retrieved ${relevantDocs.length} relevant docs for insights`);

        // STEP 2: AUGMENT - Build context from retrieved documents
        const retrievedContext = relevantDocs.length > 0
            ? relevantDocs.map(doc => `- ${doc.content}`).join('\n')
            : 'No specific study notes available yet.';

        // STEP 3: GENERATE - Create LLM prompt with RAG context
        const ragPrompt = `You are an expert study coach analyzing a student's learning patterns using retrieved study data.

**ANALYTICS DATA:**
${analyticsSummary}

**RETRIEVED STUDY CONTEXT (RAG - semantic vector search):**
${retrievedContext}

**TASK:**
Generate 3-4 personalized, actionable insights using BOTH the analytics AND the retrieved study notes.
Reference specific subjects, topics, or patterns you see in the data.

**INSTRUCTIONS:**
- Insight 1: Celebrate a specific achievement with actual numbers
- Insight 2: Identify a productive pattern (mention specific day, subject, or topic from context)
- Insight 3: Suggest improvement (reference specific subjects from notes)
- Insight 4 (optional): Motivational message about streak/growth

**RULES:**
- Be VERY specific - use actual subjects and numbers
- Keep each insight under 30 words
- Reference the retrieved study notes when relevant
- Output ONLY valid JSON array

**OUTPUT FORMAT:**
[
  {"type": "success", "icon": "Zap", "text": "specific insight with numbers"},
  {"type": "info", "icon": "Brain", "text": "pattern with subject names"},
  {"type": "warning", "icon": "Target", "text": "improvement suggestion"}
]

Types: "success", "info", "warning"
Icons: "Zap", "Brain", "Target", "Award"`;

        // STEP 4: LLM CALL - Try Ollama first, fallback to Groq
        let response;
        let usedProvider = 'unknown';

        if (USE_OLLAMA) {
            try {
                console.log(`🤖 Calling Ollama (${OLLAMA_MODEL}) with vector RAG context...`);
                const ollamaResponse = await ollama.chat({
                    model: OLLAMA_MODEL,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a study coach AI. Respond only with valid JSON arrays. Use the retrieved study context to make insights specific and actionable.'
                        },
                        {
                            role: 'user',
                            content: ragPrompt
                        }
                    ],
                    options: {
                        temperature: 0.8,
                        num_predict: 600
                    }
                });
                response = ollamaResponse.message.content;
                usedProvider = 'Ollama (local)';
                console.log('✅ Ollama response received');
            } catch (ollamaError) {
                console.warn('⚠️  Ollama failed, falling back to Groq:', ollamaError.message);
                // Fallback to Groq
                const completion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a study coach AI. Respond only with valid JSON arrays. Use the retrieved study context to make insights specific and actionable.'
                        },
                        {
                            role: 'user',
                            content: ragPrompt
                        }
                    ],
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.8,
                    max_tokens: 600,
                });
                response = completion.choices[0]?.message?.content;
                usedProvider = 'Groq (fallback)';
                console.log('✅ Groq fallback response received');
            }
        } else {
            // Use Groq directly if Ollama is disabled
            console.log('🤖 Calling Groq AI with vector RAG context...');
            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: 'You are a study coach AI. Respond only with valid JSON arrays. Use the retrieved study context to make insights specific and actionable.'
                    },
                    {
                        role: 'user',
                        content: ragPrompt
                    }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.8,
                max_tokens: 600,
            });
            response = completion.choices[0]?.message?.content;
            usedProvider = 'Groq';
            console.log('✅ Groq response received');
        }

        console.log(`📡 LLM Provider: ${usedProvider}`);

        if (!response) {
            throw new Error('No response from LLM');
        }

        // Parse JSON from LLM response
        const cleanedResponse = response.trim().replace(/```json|```/g, '');
        const insights = JSON.parse(cleanedResponse);

        if (!Array.isArray(insights) || insights.length === 0) {
            throw new Error('Invalid insights format from LLM');
        }

        console.log(`✨ Generated ${insights.length} vector RAG-powered insights`);
        return insights.slice(0, 4);

    } catch (error) {
        console.error('❌ RAG Insights Error:', error);
        console.error('Error details:', error.message);
        // Fallback to rule-based
        return generateRuleBasedInsights(analyticsData);
    }
}

/**
 * Build analytics context string
 */
function buildStudyContext(stats, weeklyProgress, subjectBreakdown) {
    const formatMins = (mins) => {
        const hrs = Math.floor(mins / 60);
        const min = mins % 60;
        return hrs > 0 ? `${hrs}h ${min}m` : `${min}m`;
    };

    const bestDay = weeklyProgress.reduce((max, day) =>
        day.minutes > max.minutes ? day : max, weeklyProgress[0]
    );

    let context = `Total Study Time: ${formatMins(stats.totalStudyTime)} (${stats.totalSessions} sessions)
This Week: ${formatMins(stats.weekStudyTime)}
Today: ${formatMins(stats.todayStudyTime)}
Focus Score: ${stats.focusScore}%
Current Streak: ${stats.streak} day${stats.streak !== 1 ? 's' : ''}

Weekly Pattern: ${weeklyProgress.map(d => `${d.day}:${d.minutes}min`).join(', ')}
Best Day: ${bestDay.day} (${bestDay.minutes}min)

Top Subjects: ${subjectBreakdown.slice(0, 3).map(s => `${s.subject} (${s.percentage}%)`).join(', ')}`;

    // Add quiz stats if available
    if (stats.totalQuizzes !== undefined) {
        context += `\n\nQuiz Performance:
Total Quizzes: ${stats.totalQuizzes}
Average Score: ${stats.avgQuizScore}%
Total XP: ${stats.totalXP}`;
    }

    return context;
}

/**
 * Fallback rule-based insights
 */
function generateRuleBasedInsights(analyticsData) {
    console.log('⚠️ Using fallback rule-based insights');
    const { stats, weeklyProgress, subjectBreakdown } = analyticsData;
    const insights = [];

    if (stats.weekStudyTime > 600) {
        insights.push({
            type: 'success',
            icon: 'Zap',
            text: `Amazing! ${Math.floor(stats.weekStudyTime / 60)} hours this week shows real dedication.`
        });
    }

    const bestDay = weeklyProgress.reduce((max, day) =>
        day.minutes > max.minutes ? day : max, weeklyProgress[0]
    );

    if (bestDay.minutes > 60) {
        insights.push({
            type: 'info',
            icon: 'Brain',
            text: `${bestDay.day} is your peak day (${bestDay.minutes}min). Schedule tough topics then!`
        });
    }

    if (stats.totalQuizzes > 0 && stats.avgQuizScore < 70) {
        insights.push({
            type: 'warning',
            icon: 'Target',
            text: `Quiz average is ${stats.avgQuizScore}%. More practice on weak topics could help.`
        });
    } else if (subjectBreakdown.length > 0 && subjectBreakdown[0].percentage > 35) {
        insights.push({
            type: 'warning',
            icon: 'Target',
            text: `${subjectBreakdown[0].subject} is ${subjectBreakdown[0].percentage}%. Balance other subjects.`
        });
    } else if (subjectBreakdown.length > 3) {
        insights.push({
            type: 'info',
            icon: 'Brain',
            text: `Balanced across ${subjectBreakdown.length} subjects. Great approach!`
        });
    }

    return insights.slice(0, 4);
}

export default { generateRAGInsights, generateRuleBasedInsights };
