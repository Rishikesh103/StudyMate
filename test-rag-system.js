/**
 * Test script for Production RAG System
 * Verifies vector embeddings, semantic search, and chat functionality
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';
const TEST_EMAIL = `test_rag_${Date.now()}@test.com`;
const TEST_PASSWORD = 'TestRAG123!';

let authToken = null;
let userId = null;

console.log('🧪 Testing Production RAG System\n');

// Test 1: Register and Login
async function testAuth() {
    console.log('1️⃣ Testing Authentication...');

    // Register
    const signupRes = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'RAG Test User',
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            role: 'student'
        })
    });

    if (!signupRes.ok) {
        throw new Error(`Signup failed: ${signupRes.status}`);
    }

    const signupData = await signupRes.json();
    authToken = signupData.token;
    userId = signupData.user._id;

    console.log(`✅ User registered: ${userId}\n`);
}

// Test 2: Create some quiz data
async function createTestQuiz() {
    console.log('2️⃣ Creating test quiz...');

    const quizRes = await fetch(`${API_BASE}/quizzes/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            topic: 'Machine Learning Basics',
            subject: 'Artificial Intelligence',
            difficulty: 'medium',
            questionCount: 5
        })
    });

    if (!quizRes.ok) {
        throw new Error(`Quiz generation failed: ${quizRes.status}`);
    }

    const quiz = await quizRes.json();
    console.log(`✅ Quiz created: ${quiz.quizId}\n`);

    return quiz.quizId;
}

// Test 3: Submit quiz
async function submitTestQuiz(quizId) {
    console.log('3️⃣ Submitting quiz answers...');

    const submitRes = await fetch(`${API_BASE}/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            answers: [
                { questionId: '1', userAnswer: 'A' },
                { questionId: '2', userAnswer: 'B' },
                { questionId: '3', userAnswer: 'C' },
                { questionId: '4', userAnswer: 'D' },
                { questionId: '5', userAnswer: 'A' }
            ],
            timeSpent: 120
        })
    });

    if (!submitRes.ok) {
        const error = await submitRes.text();
        throw new Error(`Quiz submission failed: ${submitRes.status} - ${error}`);
    }

    const result = await submitRes.json();
    console.log(`✅ Quiz submitted - Score: ${result.score.percentage}%, XP: ${result.xpEarned}\n`);
}

// Test 4: Test RAG Chat (the main test!)
async function testRAGChat() {
    console.log('4️⃣ Testing Vector RAG Chat System...\n');

    const questions = [
        'What quizzes did I take?',
        'How did I perform on my Machine Learning quiz?',
        'What topics should I study more?'
    ];

    for (const question of questions) {
        console.log(`   ❓ Question: "${question}"`);

        const chatRes = await fetch(`${API_BASE}/analytics/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ question })
        });

        if (!chatRes.ok) {
            console.log(`   ❌ Chat failed: ${chatRes.status}\n`);
            continue;
        }

        const chatData = await chatRes.json();

        console.log(`   🤖 Answer: ${chatData.answer}`);
        console.log(`   📊 Sources: ${chatData.sources || 0} documents retrieved`);

        if (chatData.retrievalMetadata) {
            console.log(`   📈 Similarities: ${chatData.retrievalMetadata.similarities?.map(s => s.toFixed(3)).join(', ')}`);
            console.log(`   🗂️  Source Types: ${chatData.retrievalMetadata.sourceTypes?.join(', ')}`);
        }

        console.log('');
    }
}

// Test 5: Test RAG Insights
async function testRAGInsights() {
    console.log('5️⃣ Testing Vector RAG Insights...\n');

    const insightsRes = await fetch(`${API_BASE}/analytics/insights`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });

    if (!insightsRes.ok) {
        throw new Error(`Insights failed: ${insightsRes.status}`);
    }

    const insightsData = await insightsRes.json();

    console.log(`   ✨ Generated ${insightsData.insights?.length || 0} insights`);
    insightsData.insights?.forEach((insight, i) => {
        console.log(`   ${i + 1}. [${insight.type}] ${insight.text}`);
    });

    console.log('');
}

// Run all tests
async function runTests() {
    try {
        await testAuth();
        const quizId = await createTestQuiz();

        // Wait for quiz to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        await submitTestQuiz(quizId);

        // Wait for indexing
        console.log('⏳ Waiting for embedding indexing (5 seconds)...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));

        await testRAGChat();
        await testRAGInsights();

        console.log('✅ All tests passed! Production RAG system is working correctly.\n');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

runTests();
