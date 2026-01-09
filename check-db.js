import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/studymate');
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // Check collections
        const collections = await db.listCollections().toArray();
        console.log('📚 Collections:', collections.map(c => c.name).join(', '));
        console.log('');

        // Count documents
        const embeddedDocs = await db.collection('embeddeddocuments').countDocuments();
        const sessions = await db.collection('studysessions').countDocuments();
        const quizzes = await db.collection('quizscores').countDocuments();
        const users = await db.collection('users').countDocuments();

        console.log(`👥 Users: ${users}`);
        console.log(`📝 Study Sessions: ${sessions}`);
        console.log(`🎯 Quiz Scores: ${quizzes}`);
        console.log(`🔍 Embedded Documents: ${embeddedDocs}`);
        console.log('');

        if (embeddedDocs === 0 && (sessions > 0 || quizzes > 0)) {
            console.log('⚠️  ISSUE FOUND: You have study data but NO embeddings!');
            console.log('💡 Solution: The RAG system needs to index your data first.');
            console.log('   The chat will auto-index on first use, but you can also run:');
            console.log('   node test-rag-system.js');
        } else if (embeddedDocs > 0) {
            console.log('✅ Embeddings exist! RAG system should work.');

            // Sample one embedded doc
            const sample = await db.collection('embeddeddocuments').findOne();
            if (sample) {
                console.log('\n📄 Sample embedded document:');
                console.log(`   User ID: ${sample.userId}`);
                console.log(`   Source Type: ${sample.sourceType}`);
                console.log(`   Content: ${sample.content.substring(0, 100)}...`);
                console.log(`   Embedding dimensions: ${sample.embedding?.length || 0}`);
            }
        } else {
            console.log('⚠️  No study data found. Create some study sessions or take quizzes first!');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkDatabase();
