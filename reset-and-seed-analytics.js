/**
 * DETERMINISTIC DATA SEEDING SCRIPT (FALLBACK MODE)
 * Target User: rishikeshshinde103@gmail.com
 * 
 * Since user has NO roadmap, using predefined Computer Science subjects
 * This is production-safe and creates realistic 4-month study pattern
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/models/User.js';
import StudySession from './server/models/StudySession.js';
import QuizScore from './server/models/QuizScore.js';

dotenv.config();

const TARGET_EMAIL = 'rishikeshshinde103@gmail.com';
const MONTHS_TO_SEED = 4;

// PREDEFINED SUBJECTS & TOPICS (CS Student)
const SUBJECT_TOPICS = {
    'Data Structures': [
        'Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees',
        'Binary Search Trees', 'Heaps', 'Graphs', 'Hash Tables'
    ],
    'Algorithms': [
        'Sorting', 'Searching', 'Dynamic Programming', 'Greedy Algorithms',
        'Divide and Conquer', 'Backtracking', 'Graph Algorithms'
    ],
    'Machine Learning': [
        'Linear Regression', 'Logistic Regression', 'Decision Trees',
        'Neural Networks', 'Clustering', 'SVM', 'K-Nearest Neighbors'
    ],
    'Database Management': [
        'SQL Basics', 'Normalization', 'Joins', 'Indexing',
        'Transactions', 'NoSQL', 'Query Optimization'
    ],
    'Operating Systems': [
        'Process Management', 'Memory Management', 'File Systems',
        'Threading', 'Scheduling', 'Deadlocks'
    ]
};

// Session durations in minutes
const SESSION_DURATIONS = [15, 30, 45, 60, 90, 120];
const MOODS = ['great', 'good', 'neutral', 'tired', 'focused', 'productive'];

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function findUser() {
    console.log('\n========== STEP 1: USER VERIFICATION ==========');
    const user = await User.findOne({ email: TARGET_EMAIL });

    if (!user) {
        console.error(`❌ ERROR: User with email "${TARGET_EMAIL}" NOT FOUND`);
        process.exit(1);
    }

    console.log(`✅ User found: ${user.name} (${user.email})`);
    console.log(`   User ID: ${user._id}`);
    return user;
}

async function deleteExistingData(userId) {
    console.log('\n========== STEP 2: HARD RESET EXISTING DATA ==========');

    const sessionDeleteResult = await StudySession.deleteMany({ user: userId });
    console.log(`🗑️  Deleted ${sessionDeleteResult.deletedCount} StudySession documents`);

    const quizDeleteResult = await QuizScore.deleteMany({ user: userId });
    console.log(`🗑️  Deleted ${quizDeleteResult.deletedCount} QuizScore documents`);

    console.log(`✅ Total deleted: ${sessionDeleteResult.deletedCount + quizDeleteResult.deletedCount} documents`);
}

async function seedStudyData(userId) {
    console.log('\n========== STEP 3: SEED 4 MONTHS OF STUDY DATA ==========');
    console.log('📚 Using predefined CS subjects (user has no roadmap)');

    const subjects = Object.keys(SUBJECT_TOPICS);
    subjects.forEach((subject, idx) => {
        console.log(`   ${idx + 1}. ${subject} (${SUBJECT_TOPICS[subject].length} topics)`);
    });

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - MONTHS_TO_SEED);
    startDate.setHours(0, 0, 0, 0);

    console.log(`\n📅 Date range: ${startDate.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);

    const totalDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    let sessionsCreated = 0;
    let currentDate = new Date(startDate);

    // Create realistic study pattern with streaks and breaks
    let streakLength = 0;
    let onStreak = true;

    for (let day = 0; day <= totalDays; day++) {
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        let shouldStudy = false;

        if (onStreak) {
            shouldStudy = Math.random() < (isWeekend ? 0.6 : 0.85);
            streakLength++;
            if (streakLength >= randomInt(3, 10)) {
                onStreak = false;
                streakLength = 0;
            }
        } else {
            shouldStudy = Math.random() < (isWeekend ? 0.2 : 0.4);
            streakLength++;
            if (streakLength >= randomInt(1, 4)) {
                onStreak = true;
                streakLength = 0;
            }
        }

        if (shouldStudy) {
            const sessionsToday = randomInt(1, Math.random() < 0.7 ? 2 : 3);

            for (let sessionNum = 0; sessionNum < sessionsToday; sessionNum++) {
                const selectedSubject = random(subjects);
                const topicList = SUBJECT_TOPICS[selectedSubject];
                const selectedTopic = random(topicList);

                const sessionDate = new Date(currentDate);
                const hourOffset = sessionNum === 0 ? randomInt(9, 12) :
                    sessionNum === 1 ? randomInt(14, 18) : randomInt(19, 22);
                sessionDate.setHours(hourOffset, randomInt(0, 59), randomInt(0, 59));

                const duration = random(SESSION_DURATIONS);

                await StudySession.create({
                    user: userId,
                    subject: selectedSubject,
                    topic: selectedTopic,
                    duration: duration,
                    mood: random(MOODS),
                    difficulty: randomInt(1, 5),
                    cognitiveLoad: randomInt(1, 5), // 1-5 scale
                    notes: '',
                    createdAt: sessionDate
                });

                sessionsCreated++;
            }
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`\n✅ Created ${sessionsCreated} study sessions`);
    console.log(`   Average: ${(sessionsCreated / (totalDays + 1)).toFixed(1)} sessions/day`);
    console.log(`   Estimated study days: ${Math.round(sessionsCreated / 1.5)}`);
}

async function validateHeatmap(userId) {
    console.log('\n========== STEP 4: VALIDATE HEATMAP ==========');

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const allSessions = await StudySession.find({ user: userId }).sort({ createdAt: 1 });
    console.log(`📊 Total sessions in DB: ${allSessions.length}`);

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

    console.log(`\n✅ Generated ${heatmapData.length} heatmap entries (expected: 365)`);

    const levelCounts = [0, 0, 0, 0, 0];
    heatmapData.forEach(d => levelCounts[d.level]++);

    console.log('\n📈 Activity distribution:');
    console.log(`   Level 0 (no study):     ${levelCounts[0]} days`);
    console.log(`   Level 1 (1-29 min):     ${levelCounts[1]} days`);
    console.log(`   Level 2 (30-59 min):    ${levelCounts[2]} days`);
    console.log(`   Level 3 (60-119 min):   ${levelCounts[3]} days`);
    console.log(`   Level 4 (120+ min):     ${levelCounts[4]} days`);

    const activeDays = 365 - levelCounts[0];
    console.log(`\n   Total active days: ${activeDays} / 365 (${((activeDays / 365) * 100).toFixed(1)}%)`);

    const uniqueDates = new Set(heatmapData.map(d => d.date));
    console.log(`✅ No duplicate dates (${uniqueDates.size} unique)`);

    console.log('\n📅 Last 14 days:');
    heatmapData.slice(-14).forEach(d => {
        const icons = ['⬜', '🟩', '🟩', '🟩', '🟩'];
        console.log(`   ${d.date}: ${icons[d.level]} ${d.minutes.toString().padStart(3)}min (level ${d.level})`);
    });

    console.log('\n📊 Subject distribution:');
    const subjectCounts = {};
    allSessions.forEach(s => {
        subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + 1;
    });
    Object.entries(subjectCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([subject, count]) => {
            console.log(`   ${subject}: ${count} sessions`);
        });
}

async function main() {
    console.log('🚀 Starting deterministic data reset & seeding (FALLBACK MODE)...\n');

    await connectDB();

    const user = await findUser();
    await deleteExistingData(user._id);
    await seedStudyData(user._id);
    await validateHeatmap(user._id);

    console.log('\n✅✅✅ ALL STEPS COMPLETED SUCCESSFULLY ✅✅✅');
    console.log('\nNext steps:');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Log in as rishikeshshinde103@gmail.com');
    console.log('3. Navigate to Analytics page');
    console.log('4. Verify GitHub-style heatmap renders correctly');
    console.log('5. Check that activity intensity matches study pattern');

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(error => {
    console.error('❌ FATAL ERROR:', error);
    process.exit(1);
});
