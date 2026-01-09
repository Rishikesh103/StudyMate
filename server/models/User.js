import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'parent', 'admin'],
        default: 'student'
    },
    avatar: {
        type: String,
        default: 'https://github.com/shadcn.png',
    },
    roadmap: {
        type: String,
        default: ''
    },
    linkedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Gamification & Statistics
    streak: {
        type: Number,
        default: 0,
        min: 0
    },
    longestStreak: {
        type: Number,
        default: 0,
        min: 0
    },
    totalStudyHours: {
        type: Number,
        default: 0,
        min: 0
    },
    level: {
        type: Number,
        default: 1,
        min: 1
    },
    xp: {
        type: Number,
        default: 0,
        min: 0
    },
    badges: [{
        type: String
    }],

    // User Preferences
    preferences: {
        notifications: {
            type: Boolean,
            default: true
        },
        dailyGoalMinutes: {
            type: Number,
            default: 60,
            min: 0
        },
        preferredStudyTime: {
            type: String,
            enum: ['morning', 'afternoon', 'evening', 'night', ''],
            default: ''
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system'
        }
    },

    // Tracking
    lastActive: {
        type: Date,
        default: Date.now
    },
    lastStudyDate: {
        type: Date
    }
}, {
    timestamps: true,
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ level: -1 }); // Leaderboard queries
userSchema.index({ createdAt: -1 }); // New users

// Methods
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.addXP = function (points) {
    this.xp += points;
    // Level up every 1000 XP
    const newLevel = Math.floor(this.xp / 1000) + 1;
    if (newLevel > this.level) {
        this.level = newLevel;
    }
};

userSchema.methods.updateStreak = function () {
    const today = new Date().setHours(0, 0, 0, 0);
    const lastStudy = this.lastStudyDate ? new Date(this.lastStudyDate).setHours(0, 0, 0, 0) : null;

    if (!lastStudy) {
        this.streak = 1;
    } else {
        const daysDiff = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
            this.streak += 1;
        } else if (daysDiff > 1) {
            this.streak = 1;
        }
    }

    if (this.streak > this.longestStreak) {
        this.longestStreak = this.streak;
    }

    this.lastStudyDate = new Date();
    return this;
};

// Middleware
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
export default User;
