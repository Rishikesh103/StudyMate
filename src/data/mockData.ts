import {
  StudySession,
  Subject,
  RevisionTask,
  AIInsight,
  HeatmapData,
  Quiz
} from '@/types';

// User placeholder - will be replaced with real auth
export const mockUser = {
  id: '1',
  name: 'New User',
  email: 'user@studymate.com',
  role: 'student' as const,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NewUser',
  createdAt: new Date(),
};

// Empty subjects - users will add their own
export const mockSubjects: Subject[] = [];

// Empty study sessions - users will log their own
export const mockStudySessions: StudySession[] = [];

// Empty revision tasks
export const mockRevisionTasks: RevisionTask[] = [];

// Default AI insights for new users
export const mockAIInsights: AIInsight[] = [
  {
    id: '1',
    type: 'tip',
    title: 'Welcome to StudyMate!',
    description: 'Start by logging your first study session to get personalized insights.',
    icon: '👋',
    color: 'primary',
    timestamp: new Date(),
  },
  {
    id: '2',
    type: 'recommendation',
    title: 'Upload Study Materials',
    description: 'Upload PDFs or PPTs to auto-generate quizzes and build your syllabus map.',
    icon: '📚',
    color: 'accent',
    timestamp: new Date(),
  },
];



export const mockQuiz: Quiz = {
  id: '1',
  title: 'Sample Quiz',
  topicId: 't1',
  questions: [
    {
      id: 'q1',
      type: 'mcq',
      question: 'This is a sample question. Upload study materials to generate real quizzes!',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
    },
  ],
};

// Generate heatmap data - empty for new users (only shows today)
export const generateHeatmapData = (): HeatmapData[] => {
  const data: HeatmapData[] = [];
  const today = new Date();

  for (let i = 365; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // All zeros for new users - no historical data
    data.push({ date: dateStr, value: 0 });
  }

  return data;
};

// Empty stats for new users
export const mockWeeklyStats = {
  totalStudyTime: 0,
  averageDaily: 0,
  topicsCompleted: 0,
  quizzesTaken: 0,
  averageQuizScore: 0,
  streakDays: 0,
  consistency: 0,
  productivity: 0,
  masteryGrowth: 0,
};

export const mockMoodData = [
  { name: 'Great', value: 0, color: 'hsl(160, 84%, 39%)' },
  { name: 'Good', value: 0, color: 'hsl(192, 91%, 48%)' },
  { name: 'Neutral', value: 0, color: 'hsl(220, 14%, 60%)' },
  { name: 'Tired', value: 0, color: 'hsl(38, 92%, 50%)' },
  { name: 'Stressed', value: 0, color: 'hsl(0, 84%, 60%)' },
];

export const mockStudyTimeData = [
  { day: 'Mon', hours: 0 },
  { day: 'Tue', hours: 0 },
  { day: 'Wed', hours: 0 },
  { day: 'Thu', hours: 0 },
  { day: 'Fri', hours: 0 },
  { day: 'Sat', hours: 0 },
  { day: 'Sun', hours: 0 },
];

export const mockTopicMasteryData: { subject: string; mastery: number }[] = [];

export const mockRadarData = [
  { metric: 'Consistency', value: 0, fullMark: 100 },
  { metric: 'Productivity', value: 0, fullMark: 100 },
  { metric: 'Mood', value: 0, fullMark: 100 },
  { metric: 'Mastery', value: 0, fullMark: 100 },
  { metric: 'Focus', value: 0, fullMark: 100 },
  { metric: 'Retention', value: 0, fullMark: 100 },
];
