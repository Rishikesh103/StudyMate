// Migration script to add titles to existing roadmaps
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Roadmap from './server/models/Roadmap.js';

dotenv.config();

async function migrateRoadmaps() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all roadmaps without a title
        const roadmapsWithoutTitle = await Roadmap.find({
            $or: [
                { title: { $exists: false } },
                { title: '' },
                { title: null }
            ]
        });

        console.log(`Found ${roadmapsWithoutTitle.length} roadmaps without titles`);

        for (const roadmap of roadmapsWithoutTitle) {
            // Generate a title based on subjects or create a default one
            const title = roadmap.subjects && roadmap.subjects.length > 0
                ? roadmap.subjects[0].name + (roadmap.subjects.length > 1 ? ` (+${roadmap.subjects.length - 1} more)` : '')
                : `Roadmap ${new Date(roadmap.createdAt).toLocaleDateString()}`;

            roadmap.title = title;
            await roadmap.save();
            console.log(`✅ Updated roadmap ${roadmap._id} with title: "${title}"`);
        }

        console.log('\n✅ Migration complete!');
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

migrateRoadmaps();
