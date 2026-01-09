// Achievement/Badge system for gamification

export const BADGES = {
    // Streak Badges
    WEEK_WARRIOR: {
        id: 'week_warrior',
        name: '7-Day Warrior',
        description: 'Studied 7 days in a row',
        icon: '🔥',
        requirement: { type: 'streak', value: 7 }
    },
    MONTH_MASTER: {
        id: 'month_master',
        name: 'Month Master',
        description: 'Studied 30 days in a row',
        icon: '⚡',
        requirement: { type: 'streak', value: 30 }
    },
    CENTURION: {
        id: 'centurion',
        name: 'Centurion',
        description: 'Reached 100-day streak',
        icon: '💯',
        requirement: { type: 'streak', value: 100 }
    },

    // Study Hours
    DEDICATED_LEARNER: {
        id: 'dedicated_learner',
        name: 'Dedicated Learner',
        description: 'Completed 10 hours of study',
        icon: '📚',
        requirement: { type: 'hours', value: 10 }
    },
    STUDY_MACHINE: {
        id: 'study_machine',
        name: 'Study Machine',
        description: 'Completed 50 hours of study',
        icon: '⚙️',
        requirement: { type: 'hours', value: 50 }
    },
    UNSTOPPABLE: {
        id: 'unstoppable',
        name: 'Unstoppable',
        description: 'Completed 100 hours of study',
        icon: '🚀',
        requirement: { type: 'hours', value: 100 }
    },

    // Quiz Performance
    QUIZ_NOVICE: {
        id: 'quiz_novice',
        name: 'Quiz Novice',
        description: 'Completed 5 quizzes',
        icon: '📝',
        requirement: { type: 'quizzes', value: 5 }
    },
    QUIZ_MASTER: {
        id: 'quiz_master',
        name: 'Quiz Master',
        description: 'Achieved 95%+ on any quiz',
        icon: '🏆',
        requirement: { type: 'quiz_score', value: 95 }
    },
    PERFECT_SCORE: {
        id: 'perfect_score',
        name: 'Perfect Score',
        description: 'Achieved 100% on a quiz',
        icon: '🎯',
        requirement: { type: 'quiz_score', value: 100 }
    },

    // Revision
    REVISION_STARTER: {
        id: 'revision_starter',
        name: 'Revision Starter',
        description: 'Completed first revision',
        icon: '🌱',
        requirement: { type: 'revisions', value: 1 }
    },
    REVISION_CHAMPION: {
        id: 'revision_champion',
        name: 'Revision Champion',
        description: 'Completed 50 revisions',
        icon: '🎖️',
        requirement: { type: 'revisions', value: 50 }
    },
    TOPIC_MASTER: {
        id: 'topic_master',
        name: 'Topic Master',
        description: 'Mastered 10 topics',
        icon: '👑',
        requirement: { type: 'mastered', value: 10 }
    },

    // Time-based
    EARLY_BIRD: {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Studied before 8 AM',
        icon: '🌅',
        requirement: { type: 'time', value: 'morning' }
    },
    NIGHT_OWL: {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Studied after 10 PM',
        icon: '🌙',
        requirement: { type: 'time', value: 'night' }
    },

    // Special
    FIRST_STEPS: {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Completed your first study session',
        icon: '👣',
        requirement: { type: 'sessions', value: 1 }
    },
    ROADMAP_CREATOR: {
        id: 'roadmap_creator',
        name: 'Roadmap Creator',
        description: 'Created your first roadmap',
        icon: '🗺️',
        requirement: { type: 'roadmaps', value: 1 }
    }
};

// Level system - XP required for each level
export const LEVEL_THRESHOLDS = [
    0,      // Level 1
    100,    // Level 2
    250,    // Level 3
    500,    // Level 4
    1000,   // Level 5
    2000,   // Level 6
    3500,   // Level 7
    5500,   // Level 8
    8000,   // Level 9
    11000,  // Level 10
    15000,  // Level 11
    20000,  // Level 12
    26000,  // Level 13
    33000,  // Level 14
    41000,  // Level 15
    50000   // Level 16+
];

// Calculate level from XP
export function calculateLevel(xp) {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            return i + 1;
        }
    }
    return 1;
}

// Calculate XP needed for next level
export function xpToNextLevel(currentXP) {
    const currentLevel = calculateLevel(currentXP);
    if (currentLevel >= LEVEL_THRESHOLDS.length) {
        return null; // Max level
    }
    const nextLevelXP = LEVEL_THRESHOLDS[currentLevel];
    return nextLevelXP - currentXP;
}

// Calculate XP reward based on activity
export const XP_REWARDS = {
    STUDY_SESSION: 20,        // Base + 1 XP per minute
    QUIZ_COMPLETION: 50,      // Base + score bonus
    REVISION_COMPLETE: 30,    // Per revision
    TOPIC_MASTERED: 100,      // Mastering a topic
    PERFECT_QUIZ: 150,        // 100% on quiz
    DAILY_STREAK: 25,         // Bonus per streak day
    ROADMAP_UPLOAD: 75        // Creating roadmap
};

// Check if user earned new badges
export function checkBadges(user, stats) {
    const newBadges = [];

    Object.values(BADGES).forEach(badge => {
        // Skip if already has badge
        if (user.badges.includes(badge.id)) return;

        const { type, value } = badge.requirement;
        let earned = false;

        switch (type) {
            case 'streak':
                earned = user.streak >= value;
                break;
            case 'hours':
                earned = user.totalStudyHours >= value;
                break;
            case 'quizzes':
                earned = stats.totalQuizzes >= value;
                break;
            case 'quiz_score':
                earned = stats.highestQuizScore >= value;
                break;
            case 'revisions':
                earned = stats.totalRevisions >= value;
                break;
            case 'mastered':
                earned = stats.masteredTopics >= value;
                break;
            case 'sessions':
                earned = stats.totalSessions >= value;
                break;
            case 'roadmaps':
                earned = stats.totalRoadmaps >= value;
                break;
            case 'time':
                // Checked at session creation time
                break;
        }

        if (earned) {
            newBadges.push(badge.id);
        }
    });

    return newBadges;
}

export default {
    BADGES,
    LEVEL_THRESHOLDS,
    XP_REWARDS,
    calculateLevel,
    xpToNextLevel,
    checkBadges
};
