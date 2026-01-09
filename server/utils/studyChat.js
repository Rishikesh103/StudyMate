import { Ollama } from 'ollama';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

// Models
import StudySession from '../models/StudySession.js';
import QuizScore from '../models/QuizScore.js';
import Note from '../models/Note.js';
import RevisionPlan from '../models/RevisionPlan.js';
import Roadmap from '../models/Roadmap.js';
import User from '../models/User.js';
import EmbeddedDocument from '../models/EmbeddedDocument.js';
import ChatHistory from '../models/ChatHistory.js';

import { generateEmbedding, cosineSimilarity } from './embeddings.js';

dotenv.config();

const ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const USE_OLLAMA = process.env.USE_OLLAMA !== 'false';

// --- TOOLS DEFINITION (Action Mode) ---
const TOOLS = [
    {
        type: "function",
        function: {
            name: "create_revision_plan",
            description: "Create a new revision plan entry for a specific subject and topic.",
            parameters: {
                type: "object",
                properties: {
                    subject: { type: "string", description: "The subject name (e.g. React, Math)" },
                    topic: { type: "string", description: "The specific topic to revise" },
                    priority: { type: "string", enum: ["high", "medium", "low"], description: "Importance level" }
                },
                required: ["subject", "topic"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_note",
            description: "Save a quick study note for the user.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string", description: "Title of the note" },
                    content: { type: "string", description: "The content/body of the note" },
                    subject: { type: "string", description: "Subject this note belongs to" }
                },
                required: ["title", "content"]
            }
        }
    }
];

// --- 1. INDEXING (Kept same as before, simplified for brevity here) ---
export async function indexUserSessions(userId) {
    // ... (Your existing comprehensive indexing code from previous step goes here)
    // For now, assuming the indexing function we wrote previously is present
    return { indexed: 0 };
}

// --- 2. HELPER: EXECUTE TOOLS ---
async function handleToolCall(toolCall, userId) {
    const fnName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    console.log(`🤖 Jarvis Action: Executing ${fnName} with`, args);

    try {
        if (fnName === 'create_revision_plan') {
            const nextReview = new Date();
            nextReview.setDate(nextReview.getDate() + 1); // Default to tomorrow

            const plan = await RevisionPlan.create({
                user: userId,
                subject: args.subject,
                topicName: args.topic,
                priority: args.priority || 'medium',
                status: 'pending',
                nextReview,
                addedFrom: 'ai_chat'
            });
            return `✅ Created revision plan for "${args.topic}" in ${args.subject}. Scheduled for tomorrow!`;
        }

        if (fnName === 'create_note') {
            const note = await Note.create({
                user: userId,
                title: args.title,
                content: args.content,
                subject: args.subject || 'General',
                tags: ['ai-generated']
            });
            return `✅ Saved note: "${args.title}"`;
        }
    } catch (error) {
        console.error("Tool execution failed:", error);
        return `❌ Failed to execute action: ${error.message}`;
    }
}

// --- 3. MAIN CHAT HANDLER ---
export async function answerStudyQuestion(userId, question) {
    try {
        // A. LOAD HISTORY
        let chatHistory = await ChatHistory.findOne({ userId });
        if (!chatHistory) {
            chatHistory = await ChatHistory.create({ userId, messages: [] });
        }

        // B. RAG RETRIEVAL
        // (Using the vectorSearch logic from previous steps)
        const queryEmbedding = await generateEmbedding(question);
        const docs = await EmbeddedDocument.find({ userId }).lean();
        const scored = docs.map(doc => ({ ...doc, similarity: cosineSimilarity(queryEmbedding, doc.embedding) }));
        const retrievedDocs = scored.sort((a, b) => b.similarity - a.similarity).slice(0, 5).filter(d => d.similarity > 0.25);

        let contextData = "No specific database records found.";
        if (retrievedDocs.length > 0) {
            contextData = retrievedDocs.map(d => `[${d.sourceType.toUpperCase()}] ${d.content}`).join('\n');
        }

        // C. CONSTRUCT MESSAGES
        // Get last 10 messages for context window
        const recentHistory = chatHistory.messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
        }));

        const systemPrompt = `You are StudyMate AI, an intelligent study assistant with "Jarvis-like" capabilities.

**CAPABILITIES:**
1. You can ANSWER questions using the retrieved data below.
2. You can TAKE ACTION. If the user says "Remind me to study React" or "Save a note about loops", CALL the appropriate tool.
3. Be concise, friendly, and proactive.

**RETRIEVED DATA:**
${contextData}`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...recentHistory,
            { role: 'user', content: question }
        ];

        // D. CALL LLM (With Tools)
        // Note: Ollama tool calling is experimental, so we prioritize Groq here for reliability
        let responseMessage;
        let toolCalls;

        try {
            const completion = await groq.chat.completions.create({
                messages,
                model: 'llama-3.3-70b-versatile',
                tools: TOOLS,
                tool_choice: "auto",
                temperature: 0.6
            });

            responseMessage = completion.choices[0].message;
            toolCalls = responseMessage.tool_calls;

        } catch (err) {
            console.log("Groq error, falling back to Ollama (Text Only)", err.message);
            const oResponse = await ollama.chat({ model: OLLAMA_MODEL, messages });
            responseMessage = oResponse.message;
        }

        let finalAnswer = responseMessage.content || "";

        // E. HANDLE TOOL CALLS (If any)
        if (toolCalls) {
            // Append the assistant's "thought process" (tool call request) to history
            messages.push(responseMessage);

            for (const toolCall of toolCalls) {
                const functionResponse = await handleToolCall(toolCall, userId);

                // Append the result of the tool to conversation
                messages.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: toolCall.function.name,
                    content: functionResponse,
                });
            }

            // Call LLM again to generate the final human-readable response
            const secondResponse = await groq.chat.completions.create({
                messages,
                model: 'llama-3.3-70b-versatile'
            });
            finalAnswer = secondResponse.choices[0].message.content;
        }

        // F. SAVE HISTORY
        chatHistory.messages.push({ role: 'user', content: question });
        chatHistory.messages.push({ role: 'assistant', content: finalAnswer });

        // Keep history manageable (last 50 messages)
        if (chatHistory.messages.length > 50) {
            chatHistory.messages = chatHistory.messages.slice(-50);
        }
        await chatHistory.save();

        return {
            success: true,
            answer: finalAnswer,
            sources: retrievedDocs.length,
            actionTaken: !!toolCalls
        };

    } catch (error) {
        console.error('StudyChat Error:', error);
        return { success: false, answer: "I encountered an error processing your request.", error: error.message };
    }
}

// Keep your existing vectorSearch and indexUserSessions exports
export { generateEmbedding, cosineSimilarity }; // Re-export if needed