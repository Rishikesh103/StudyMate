import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api/auth';

async function testAuth() {
    console.log('🚀 Starting Auth Test...');
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'password123';

    // 1. Test Signup
    console.log(`\n1. Testing Signup (${testEmail})...`);
    try {
        const signupRes = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: testEmail,
                password: testPassword,
                role: 'student'
            })
        });

        const signupData = await signupRes.json();
        console.log('Signup Status:', signupRes.status);
        console.log('Signup Response:', JSON.stringify(signupData, null, 2));

        if (!signupRes.ok) throw new Error('Signup failed');

    } catch (e) {
        console.error('❌ Signup Error:', e);
        return;
    }

    // 2. Test Login
    console.log(`\n2. Testing Login (${testEmail})...`);
    try {
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword
            })
        });

        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);
        console.log('Login Response:', JSON.stringify(loginData, null, 2));

        if (loginRes.ok && loginData.token) {
            console.log('\n✅ AUTHENTICATION WORKING CORRECTLY (Backend is fine)');
        } else {
            console.log('\n❌ LOGIN FAILED');
        }

    } catch (e) {
        console.error('❌ Login Error:', e);
    }
}

testAuth();
