// Drop the unique index on roadmaps.user field
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function dropUniqueIndex() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('roadmaps');

        // Get all indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);

        // Drop the unique user index
        try {
            await collection.dropIndex('user_1');
            console.log('✅ Dropped unique index on user field');
        } catch (err) {
            console.log('ℹ️ Index already dropped or does not exist');
        }

        // Verify remaining indexes
        const remainingIndexes = await collection.indexes();
        console.log('Remaining indexes:', remainingIndexes);

        await mongoose.connection.close();
        console.log('✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

dropUniqueIndex();
