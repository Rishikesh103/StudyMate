
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5000/api';

async function testScan() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'student@example.com', password: 'password123' })
        });

        if (!loginRes.ok) throw new Error('Login failed');
        const { token } = await loginRes.json();
        console.log('Got token.');

        // 2. Create dummy file
        const filePath = 'test_syllabus.txt';
        fs.writeFileSync(filePath, 'Unit 1: Intro to Biology. Unit 2: Cells. Unit 3: Genetics.');

        // 3. Upload
        console.log('Uploading file...');
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        const res = await fetch(`${API_URL}/users/roadmap/scan`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            },
            body: form
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response body preview:', text.substring(0, 500));

        try {
            const data = JSON.parse(text);
            console.log('JSON Response:', data);
        } catch (e) {
            console.log('Could not parse JSON. Probably HTML error.');
        }

    } catch (err) {
        console.error('Test failed:', err);
    }
}

testScan();
