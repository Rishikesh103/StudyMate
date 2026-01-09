import { Ollama } from 'ollama';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Ollama client
const ollama = new Ollama({
    host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
});

// Groq fallback
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const USE_OLLAMA = process.env.USE_OLLAMA !== 'false';

/**
 * Generate AI-powered study insights based on user's analytics data
 * @param {Object} analyticsData - User's study analytics
 * @returns {Promise<Array>} Array of insight objects
 */
export async function generateAIInsights(analyticsData) {
    try {
        const { stats, weeklyProgress, subjectBreakdown, recentSessions } = analyticsData;

        // Build context from user data
        const context = buildStudyContext(stats, weeklyProgress, subjectBreakdown, recentSessions);

        // Create prompt for Groq AI
        const prompt = `You are an expert study coach analyzing a student's learning patterns. Generate 3-4 personalized, actionable insights.

STUDENT DATA:
${context}

INSTRUCTIONS:
- Insight 1: Celebrate a specific achievement with data
- Insight 2: Identify a productive pattern (best day/time, subject strength)
- Insight 3: Suggest an improvement (subject balance, consistency, etc.)
- Insight 4 (optional): Motivational message about streak or progress

RULES:
- Be specific with numbers
- Keep each insight under 25 words
- Be encouraging but honest
- Focus on actionable advice

Respond ONLY with a JSON array of insights in this exact format:
[
  {"type": "success", "icon": "Zap", "text": "Your insight here"},
  {"type": "info", "icon": "Brain", "text": "Your insight here"},
  {"type": "warning", "icon": "Target", "text": "Your insight here"}
]

Types: "success" (achievements), "info" (patterns), "warning" (improvements)
Icons: "Zap" (energy), "Brain" (analysis), "Target" (goals), "Award" (achievements)`;

        // Call LLM - Try Ollama first, fallback to Groq
        let response;
        let usedProvider = 'unknown';

        if (USE_OLLAMA) {
            try {
                console.log(`🤖 Calling Ollama (${OLLAMA_MODEL}) for insights...`);
                const ollamaResponse = await ollama.chat({
                    model: OLLAMA_MODEL,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful study coach. Always respond with valid JSON arrays only.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    options: {
                        temperature: 0.7,
                        num_predict: 500
                    }
                });
                response = ollamaResponse.message.content;
                usedProvider = 'Ollama (local)';
                console.log('✅ Ollama response received');
            } catch (ollamaError) {
                console.warn('⚠️  Ollama failed, falling back to Groq:', ollamaError.message);
                // Fallback to Groq
                const completion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful study coach. Always respond with valid JSON arrays only.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.7,
                    max_tokens: 500,
                });
                response = completion.choices[0]?.message?.content;
                usedProvider = 'Groq (fallback)';
                console.log('✅ Groq fallback response received');
            }
        } else {
            // Use Groq directly if Ollama is disabled
            console.log('🤖 Calling Groq for insights...');
            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful study coach. Always respond with valid JSON arrays only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 500,
            });
            response = completion.choices[0]?.message?.content;
            usedProvider = 'Groq';
            console.log('✅ Groq response received');
        }

        console.log(`📡 LLM Provider: ${usedProvider}`);

        if (!response) {
            throw new Error('No response from AI');
        }

        // Parse JSON response
        const insights = JSON.parse(response.trim());

        // Validate structure
        if (!Array.isArray(insights) || insights.length === 0) {
            throw new Error('Invalid insights format');
        }

        return insights.slice(0, 4); // Max 4 insights

    } catch (error) {
        console.error('AI Insights Error:', error);
        // Fallback to rule-based insights
        return generateRuleBasedInsights(analyticsData);
    }
}

/**
 * Build context string from analytics data
 */
function buildStudyContext(stats, weeklyProgress, subjectBreakdown, recentSessions) {
    const {
        totalStudyTime,
        weekStudyTime,
        todayStudyTime,
        totalSessions,
        focusScore,
        streak,
        dailyProgress
    } = stats;

    // Format times
    const formatMins = (mins) => {
        const hrs = Math.floor(mins / 60);
        const min = mins % 60;
        return hrs > 0 ? `${hrs}h ${min}m` : `${min}m`;
    };

    // Find best study day
    const bestDay = weeklyProgress.reduce((max, day) =>
        day.minutes > max.minutes ? day : max, weeklyProgress[0]
    );

    // Find worst day
    const worstDay = weeklyProgress.reduce((min, day) =>
        day.minutes < min.minutes ? day : min, weeklyProgress[0]
    );

    // Top subject
    const topSubject = subjectBreakdown[0] || null;

    let context = `
Total Study Time: ${formatMins(totalStudyTime)} (${totalSessions} sessions)
This Week: ${formatMins(weekStudyTime)}
Today: ${formatMins(todayStudyTime)}
Focus Score: ${focusScore}%
Current Streak: ${streak} day${streak !== 1 ? 's' : ''}
Daily Goal Progress: ${dailyProgress}%

Weekly Pattern:
`;

    weeklyProgress.forEach(day => {
        context += `- ${day.day}: ${day.minutes}min\n`;
    });

    context += `\nBest Day: ${bestDay.day} (${bestDay.minutes}min)
Worst Day: ${worstDay.day} (${worstDay.minutes}min)

Subject Distribution:
`;

    subjectBreakdown.slice(0, 5).forEach(sub => {
        context += `- ${sub.subject}: ${formatMins(sub.minutes)} (${sub.percentage}%)\n`;
    });

    if (topSubject) {
        context += `\nTop Subject: ${topSubject.subject} at ${topSubject.percentage}%`;
    }

    return context;
}

/**
 * Fallback rule-based insights if AI fails
 */
function generateRuleBasedInsights(analyticsData) {
    const { stats, weeklyProgress, subjectBreakdown } = analyticsData;
    const insights = [];

    // Achievement insight
    if (stats.weekStudyTime > 600) {
        insights.push({
            type: 'success',
            icon: 'Zap',
            text: `Amazing! ${Math.floor(stats.weekStudyTime / 60)} hours this week shows real dedication. Keep it up!`
        });
    } else if (stats.weekStudyTime > 0) {
        insights.push({
            type: 'success',
            icon: 'Zap',
            text: `You studied ${Math.floor(stats.weekStudyTime / 60)} hours this week. Consistency is key!`
        });
    }

    // Streak insight
    if (stats.streak > 3) {
        insights.push({
            type: 'success',
            icon: 'Award',
            text: `${stats.streak} day streak! You're building a powerful study habit.`
        });
    }

    // Pattern insight
    const bestDay = weeklyProgress.reduce((max, day) =>
        day.minutes > max.minutes ? day : max, weeklyProgress[0]
    );

    if (bestDay.minutes > 60) {
        insights.push({
            type: 'info',
            icon: 'Brain',
            text: `${bestDay.day} is your peak day (${bestDay.minutes}min). Schedule tough topics then!`
        });
    }

    // Subject balance
    if (subjectBreakdown.length > 0) {
        const topSubject = subjectBreakdown[0];
        if (topSubject.percentage > 40) {
            insights.push({
                type: 'warning',
                icon: 'Target',
                text: `${topSubject.subject} is ${topSubject.percentage}% of your time. Consider balancing other subjects.`
            });
        } else {
            insights.push({
                type: 'info',
                icon: 'Brain',
                text: `Balanced study across ${subjectBreakdown.length} subjects. Great approach!`
            });
        }
    }

    // Ensure at least 3 insights
    if (insights.length < 3) {
        insights.push({
            type: 'info',
            icon: 'Target',
            text: 'Keep logging sessions to unlock personalized insights!'
        });
    }

    return insights.slice(0, 4);
}

export default { generateAIInsights, generateRuleBasedInsights };
