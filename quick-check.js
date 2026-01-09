import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/models/User.js';
import StudySession from './server/models/StudySession.js';

dotenv.config();

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOne({ email: 'rishikeshshinde103@gmail.com' });
    console.log('User ID:', user._id.toString());

    const count = await StudySession.countDocuments({ user: user._id });
    console.log('Total sessions:', count);

    if (count > 0) {
        const recent = await StudySession.find({ user: user._id }).sort({ createdAt: -1 }).limit(5);
        console.log('\nRecent 5 sessions:');
        recent.forEach(s => {
            console.log(`- ${s.createdAt.toISOString().split('T')[0]}: ${s.subject} - ${s.duration}min`);
        });
    }

    await mongoose.disconnect();
}

main();
