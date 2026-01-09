import fetch from 'node-fetch';
import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studymate');
        // Find the test user
        const user = await User.findOne({ email: 'test@example.com' });

        if (!user) {
            console.log('❌ No user found with email test@example.com');
            process.exit(1);
        }

        console.log(`👤 Found user: ${user.name}`);

        // Generate token directly to bypass login issues
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        console.log('🔑 Generated test token');

        // Test Chat Endpoint
        console.log('💬 Sending chat request...');
        const chatRes = await fetch('http://localhost:5000/api/analytics/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                question: "What is the capital of France? Explain briefly.",
                conversationHistory: []
            })
        });

        const rawText = await chatRes.text();

        try {
            const chatData = JSON.parse(rawText);
            console.log('📦 Status:', chatRes.status);

            if (chatData.success && chatData.answer) {
                console.log('✅ CHAT VERIFICATION SUCCESS!');
                console.log('🤖 AI Answer:', chatData.answer);
                console.log('📚 Sources Used:', chatData.sources);
            } else {
                console.log('❌ Chat Verification FAILED');
                console.log('Response:', JSON.stringify(chatData, null, 2));
            }
        } catch (e) {
            console.log('❌ Failed to parse JSON response');
            console.log('Raw Response:', rawText);
        }

        process.exit(0);

    } catch (e) {
        console.error('❌ Script Error:', e);
        process.exit(1);
    }
}

verify();
