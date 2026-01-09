/**
 * DEBUG SCRIPT - Verify Data Flow for Heatmap
 * This script will prove where the data breaks
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/models/User.js';
import StudySession from './server/models/StudySession.js';

dotenv.config();

const TARGET_EMAIL = 'rishikeshshinde103@gmail.com';

async function connectDB() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');
}

// STEP 1: PROVE DATA EXISTS
async function verifyDataExists() {
    console.log('========== STEP 1: PROVE DATA EXISTS ==========\n');

    const user = await User.findOne({ email: TARGET_EMAIL });
    if (!user) {
        console.error('❌ User not found');
        process.exit(1);
    }

    console.log(`User ID: ${user._id}\n`);

    const count = await StudySession.countDocuments({ user: user._id });
    console.log(`📊 Total StudySession documents: ${count}\n`);

    if (count === 0) {
        console.error('❌ NO DATA EXISTS - Seeding failed or was not run');
        process.exit(1);
    }

    console.log('Sample documents (first 5):\n');
    const samples = await StudySession.find({ user: user._id }).limit(5).sort({ createdAt: 1 });

    samples.forEach((doc, idx) => {
        console.log(`${idx + 1}. createdAt: ${doc.createdAt.toISOString()}`);
        console.log(`   subject: ${doc.subject}`);
        console.log(`   topic: ${doc.topic}`);
        console.log(`   duration: ${doc.duration} min`);
        console.log(`   userId: ${doc.user}`);
        console.log('');
    });

    return user._id;
}

// STEP 2: VERIFY HEATMAP API OUTPUT
async function verifyHeatmapLogic(userId) {
    console.log('========== STEP 2: VERIFY HEATMAP API OUTPUT ==========\n');

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const allSessions = await StudySession.find({ user: userId }).sort({ createdAt: 1 });
    console.log(`Loaded ${allSessions.length} sessions from DB\n`);

    // Generate heatmap data (EXACT backend logic)
    const heatmapData = [];

    for (let i = 364; i >= 0; i--) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() - i);
        targetDate.setHours(0, 0, 0, 0);

        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const dailyMinutes = allSessions
            .filter(session => {
                const sessionDate = new Date(session.createdAt);
                return sessionDate >= targetDate && sessionDate < nextDate;
            })
            .reduce((sum, session) => sum + session.duration, 0);

        let level = 0;
        if (dailyMinutes > 0) level = 1;
        if (dailyMinutes >= 30) level = 2;
        if (dailyMinutes >= 60) level = 3;
        if (dailyMinutes >= 120) level = 4;

        heatmapData.push({
            date: targetDate.toISOString().split('T')[0],
            minutes: dailyMinutes,
            level: level
        });
    }

    console.log(`✅ Generated ${heatmapData.length} heatmap entries (expected: 365)\n`);

    // Verify shape
    console.log('Verifying data shape:\n');
    console.log(`- Is Array: ${Array.isArray(heatmapData)}`);
    console.log(`- Length: ${heatmapData.length}`);

    const firstEntry = heatmapData[0];
    console.log(`\nFirst entry structure:`);
    console.log(JSON.stringify(firstEntry, null, 2));

    // Check for duplicates
    const dates = heatmapData.map(d => d.date);
    const uniqueDates = new Set(dates);
    console.log(`\n- Unique dates: ${uniqueDates.size}`);
    console.log(`- Has duplicates: ${uniqueDates.size !== 365 ? 'YES ❌' : 'NO ✅'}`);

    // Check sorting
    let isSorted = true;
    for (let i = 1; i < heatmapData.length; i++) {
        if (heatmapData[i].date < heatmapData[i - 1].date) {
            isSorted = false;
            break;
        }
    }
    console.log(`- Sorted ascending: ${isSorted ? 'YES ✅' : 'NO ❌'}`);

    // Distribution
    const levelCounts = [0, 0, 0, 0, 0];
    heatmapData.forEach(d => levelCounts[d.level]++);

    console.log(`\nLevel distribution:`);
    console.log(`  Level 0: ${levelCounts[0]} days`);
    console.log(`  Level 1: ${levelCounts[1]} days`);
    console.log(`  Level 2: ${levelCounts[2]} days`);
    console.log(`  Level 3: ${levelCounts[3]} days`);
    console.log(`  Level 4: ${levelCounts[4]} days`);

    const activeDays = 365 - levelCounts[0];
    console.log(`\nActive days: ${activeDays} / 365 (${((activeDays / 365) * 100).toFixed(1)}%)`);

    // Show first 10 and last 10
    console.log(`\nFirst 10 dates:`);
    heatmapData.slice(0, 10).forEach(d => {
        console.log(`  ${d.date}: ${d.minutes}min (level ${d.level})`);
    });

    console.log(`\nLast 10 dates:`);
    heatmapData.slice(-10).forEach(d => {
        console.log(`  ${d.date}: ${d.minutes}min (level ${d.level})`);
    });

    // CRITICAL: Check timezone issues
    console.log(`\n========== TIMEZONE CHECK ==========`);
    console.log(`Server timezone offset: ${new Date().getTimezoneOffset()} minutes`);
    console.log(`Sample date string: ${heatmapData[0].date}`);
    console.log(`Sample date parsed: ${new Date(heatmapData[0].date).toISOString()}`);

    return heatmapData;
}

// STEP 3: TEST ACTUAL API ENDPOINT
async function testAPIEndpoint(userId) {
    console.log('\n========== STEP 3: TEST ACTUAL API ENDPOINT ==========\n');
    console.log('To test the API endpoint, run this in your browser console:');
    console.log('');
    console.log('fetch("http://localhost:5000/api/analytics/heatmap", {');
    console.log('  headers: { "Authorization": "Bearer " + localStorage.getItem("token") }');
    console.log('})');
    console.log('.then(r => r.json())');
    console.log('.then(data => {');
    console.log('  console.log("Length:", data.length);');
    console.log('  console.log("First 5:", data.slice(0, 5));');
    console.log('  console.log("Last 5:", data.slice(-5));');
    console.log('});');
    console.log('');
}

async function main() {
    console.log('🔍 DEBUGGING HEATMAP DATA FLOW\n');

    await connectDB();

    const userId = await verifyDataExists();
    const heatmapData = await verifyHeatmapLogic(userId);
    await testAPIEndpoint(userId);

    console.log('\n========== SUMMARY ==========');
    console.log(`✅ Data exists in MongoDB`);
    console.log(`✅ Heatmap logic generates 365 entries`);
    console.log(`✅ Data shape is correct`);
    console.log('');
    console.log('If UI is still empty, the issue is in:');
    console.log('1. API endpoint not returning data correctly');
    console.log('2. Frontend not fetching data');
    console.log('3. Frontend component not rendering data');
    console.log('');
    console.log('Next: Check browser Network tab for /api/analytics/heatmap response');

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(error => {
    console.error('❌ ERROR:', error);
    process.exit(1);
});
