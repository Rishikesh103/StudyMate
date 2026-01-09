export type UserRole = 'student' | 'parent' | 'teacher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface StudySession {
  id: string;
  userId: string;
  subject: string;
  topic: string;
  subtopic: string;
  duration: number; // in minutes
  mood: 'great' | 'good' | 'neutral' | 'tired' | 'stressed';
  difficulty: 1 | 2 | 3 | 4 | 5;
  cognitiveLoad: number; // 0-100
  notes?: string;
  date: Date;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  name: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  subtopics: string[];
  mastery: number; // 0-100
  lastStudied?: Date;
  quizScore?: number;
}

export interface Quiz {
  id: string;
  title: string;
  topicId: string;
  questions: QuizQuestion[];
  score?: number;
  completedAt?: Date;
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'conceptual' | 'scenario';
  question: string;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
  explanation?: string;
}

export interface RevisionTask {
  id: string;
  topicId: string;
  topicName: string;
  subject: string;
  scheduledDate: Date;
  priority: 'high' | 'medium' | 'low';
  forgottenScore: number; // 0-100, higher means more forgotten
  completed: boolean;
}

export interface AIInsight {
  id: string;
  type: 'tip' | 'warning' | 'achievement' | 'recommendation';
  title: string;
  description: string;
  icon: string;
  color: string;
  timestamp: Date;
}

export interface WeeklyReport {
  id: string;
  studentId: string;
  weekStart: Date;
  weekEnd: Date;
  totalStudyTime: number;
  averageMood: string;
  topicsStudied: number;
  quizzesTaken: number;
  averageQuizScore: number;
  consistencyScore: number;
  parentRemarks?: string;
  generatedAt: Date;
}



export interface BurnoutRisk {
  level: 'low' | 'medium' | 'high';
  factors: string[];
  recommendations: string[];
}

export interface TopicNode {
  id: string;
  name: string;
  mastery: number;
  prerequisites: string[];
  x?: number;
  y?: number;
}

export interface HeatmapData {
  date: string;
  value: number;
}
