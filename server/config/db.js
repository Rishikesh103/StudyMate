import mongoose from 'mongoose';

const connectDB = async (retries = 3, delay = 2000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studymate', {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
            console.log(`📁 Database: ${conn.connection.name}`);
            return conn;
        } catch (error) {
            console.error(`❌ MongoDB Connection Error (Attempt ${attempt}/${retries}):`, error.message);

            if (attempt === retries) {
                console.error('\n🔴 UNABLE TO CONNECT TO MONGODB');
                console.error('Please ensure MongoDB is running:');
                console.error('  - Windows: Run "net start MongoDB" in Administrator PowerShell');
                console.error('  - Or start MongoDB manually: "mongod --dbpath=C:\\data\\db"');
                console.error(`  - Connection URI: ${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studymate'}\n`);
                process.exit(1);
            }

            console.log(`⏳ Retrying in ${delay / 1000} seconds...\n`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

export default connectDB;
