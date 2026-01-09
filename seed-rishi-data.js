// Seed realistic 3 months of data for user Rishi - FINAL FIXED VERSION
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/models/User.js';
import Roadmap from './server/models/Roadmap.js';
import StudySession from './server/models/StudySession.js';
import QuizScore from './server/models/QuizScore.js';
import { calculateLevel } from './server/utils/gamification.js';

dotenv.config();

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const weightedRandom = (min, max) => Math.floor(min + (max - min) * Math.pow(Math.random(), 0.5));

const MOODS = ['great', 'good', 'neutral', 'tired', 'stressed', 'productive', 'focused'];
const COGNITIVE_LOADS = [10, 25, 40, 55, 70, 85];
const QUIZ_DIFFICULTIES = ['easy', 'medium', 'hard'];

async function seedData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const user = await User.findOne({ name: /rishi/i });
        if (!user) {
            console.log('❌ User "Rishi" not found');
            process.exit(1);
        }
        console.log(`✅ Found user: ${user.name}\n`);

        const roadmaps = await Roadmap.find({ user: user._id });
        if (roadmaps.length < 2) {
            console.log(`❌ Need 2 roadmaps, found ${roadmaps.length}`);
            process.exit(1);
        }
        console.log(`✅ Found ${roadmaps.length} roadmaps\n`);

        await StudySession.deleteMany({ user: user._id });
        await QuizScore.deleteMany({ user: user._id });
        console.log('✅ Cleaned old data\n');

        const allSubjects = [];
        roadmaps.forEach(rm => {
            rm.subjects.forEach(subj => {
                allSubjects.push({
                    subjectName: subj.name,
                    topics: subj.topics.map(t => t.name)
                });
            });
        });

        console.log(`📚 Total subjects: ${allSubjects.length}\n`);
        console.log('📅 Generating 3 months of data...\n');

        const today = new Date();
        let totalXP = 0;
        let totalMinutes = 0;
        let streak = 0;
        let longestStreak = 0;
        let lastStudyDate = null;
        let sessionsCreated = 0;
        let quizzesCreated = 0;

        for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
            const date = new Date(today);
            date.setDate(date.getDate() - daysAgo);
            date.setHours(randomInt(8, 22), randomInt(0, 59), 0, 0);

            const dayOfWeek = date.getDay();
            let studyProbability = 0.7;
            if (dayOfWeek === 0 || dayOfWeek === 6) studyProbability = 0.4;

            if (Math.random() < studyProbability) {
                if (lastStudyDate) {
                    const daysDiff = Math.floor((date - lastStudyDate) / (1000 * 60 * 60 * 24));
                    if (daysDiff === 1) {
                        streak++;
                        if (streak > longestStreak) longestStreak = streak;
                    } else if (daysDiff > 1) {
                        streak = 1;
                    }
                } else {
                    streak = 1;
                }
                lastStudyDate = new Date(date);

                const sessionCount = Math.random() < 0.7 ? 1 : 2;

                for (let i = 0; i < sessionCount; i++) {
                    const subject = random(allSubjects);
                    const topic = random(subject.topics);
                    const duration = randomInt(30, 120);

                    await StudySession.create({
                        user: user._id,
                        subject: subject.subjectName,
                        topic: topic,
                        duration,
                        mood: random(MOODS),
                        difficulty: randomInt(2, 5),
                        cognitiveLoad: random(COGNITIVE_LOADS),
                        notes: '',
                        createdAt: date
                    });

                    totalMinutes += duration;
                    totalXP += 20 + duration;
                    sessionsCreated++;
                }

                // Create quiz with required topic field
                if (Math.random() < 0.3) {
                    const subject = random(allSubjects);
                    const topic = random(subject.topics); // Pick a topic for quiz
                    const score = weightedRandom(60, 100);
                    const totalQuestions = randomInt(10, 20);

                    await QuizScore.create({
                        user: user._id,
                        subject: subject.subjectName,
                        topic: topic, // REQUIRED FIELD
                        score,
                        totalQuestions,
                        correctAnswers: Math.round((score / 100) * totalQuestions),
                        timeSpent: randomInt(15, 45),
                        difficulty: random(QUIZ_DIFFICULTIES),
                        createdAt: date
                    });

                    totalXP += 50 + (score >= 95 ? 50 : score >= 80 ? 25 : 0);
                    quizzesCreated++;
                }

                if (sessionsCreated % 10 === 0) {
                    console.log(`  📖 Progress: ${sessionsCreated} sessions, ${quizzesCreated} quizzes...`);
                }
            }
        }

        user.xp = totalXP;
        user.level = calculateLevel(totalXP);
        user.totalStudyHours = totalMinutes / 60;
        user.streak = streak;
        user.longestStreak = longestStreak;
        user.lastStudyDate = lastStudyDate;
        user.badges = [];

        if (longestStreak >= 7) user.badges.push('week_warrior');
        if (longestStreak >= 30) user.badges.push('month_master');
        if (user.totalStudyHours >= 10) user.badges.push('dedicated_learner');
        if (user.totalStudyHours >= 50) user.badges.push('study_machine');

        await user.save();

        console.log('\n✅ DATA SEED COMPLETE!\n');
        console.log('📊 FINAL STATISTICS:');
        console.log(`   📖 Study Sessions: ${sessionsCreated}`);
        console.log(`   🎯 Quizzes Taken: ${quizzesCreated}`);
        console.log(`   ⏱️  Total Study Time: ${user.totalStudyHours.toFixed(1)} hours`);
        console.log(`   🔥 Current Streak: ${streak} days`);
        console.log(`   ⚡ Longest Streak: ${longestStreak} days`);
        console.log(`   ⭐ Total XP: ${totalXP}`);
        console.log(`   🎖️  Level: ${user.level}`);
        console.log(`   🏆 Badges: ${user.badges.join(', ') || 'none'}\n`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
        await mongoose.connection.close();
        process.exit(1);
    }
}

seedData();
