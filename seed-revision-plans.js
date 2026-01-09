// Add revision plans to Rishi's account - SIMPLIFIED
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/models/User.js';
import Roadmap from './server/models/Roadmap.js';
import RevisionPlan from './server/models/RevisionPlan.js';

dotenv.config();

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seedRevisionPlans() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const user = await User.findOne({ name: /rishi/i });
        if (!user) {
            console.log('❌ User "Rishi" not found');
            process.exit(1);
        }

        const roadmaps = await Roadmap.find({ user: user._id });
        if (roadmaps.length === 0) {
            console.log('❌ No roadmaps found');
            process.exit(1);
        }

        console.log(`✅ User: ${user.name}`);
        console.log(`✅ Roadmaps: ${roadmaps.length}\n`);

        await RevisionPlan.deleteMany({ user: user._id });
        console.log('🧹 Cleaned old plans\n');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalAdded = 0;
        let todayCount = 0;

        console.log('📅 Creating revision plans...\n');

        for (const roadmap of roadmaps) {
            for (const subject of roadmap.subjects) {
                // Add 50% of topics
                const topicsToAdd = Math.ceil(subject.topics.length * 0.5);
                const shuffled = [...subject.topics].sort(() => 0.5 - Math.random());

                for (let i = 0; i < topicsToAdd && i < shuffled.length; i++) {
                    const topic = shuffled[i];

                    // Create simple revision plan
                    const daysOffset = randomInt(-2, 7); // Some overdue, some today, some upcoming
                    const nextReview = new Date(today);
                    nextReview.setDate(today.getDate() + daysOffset);

                    try {
                        await RevisionPlan.create({
                            user: user._id,
                            roadmapId: roadmap._id,
                            subject: subject.name,
                            topicName: topic.name,
                            topicId: topic._id.toString(),
                            nextReview,
                            priority: random(['low', 'medium', 'high']),
                            addedFrom: 'bulk_import'
                        });

                        totalAdded++;
                        if (daysOffset <= 0) todayCount++;

                        if (totalAdded % 5 === 0) {
                            console.log(`  ✓ Added ${totalAdded} topics...`);
                        }
                    } catch (err) {
                        console.log(`  ⚠️  Skipped ${topic.name}: ${err.message}`);
                    }
                }
            }
        }

        console.log(`\n✅ COMPLETE!\n`);
        console.log(`📊 STATS:`);
        console.log(`   📚 Total: ${totalAdded}`);
        console.log(`   📅 Due today/overdue: ${todayCount}\n`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
}

seedRevisionPlans();
