import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3, TrendingUp, Award, Clock, Target, Brain, Zap,
  Calendar, Loader2, RefreshCcw, BookOpen, CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";
import { StudyHeatmap } from "@/components/analytics/StudyHeatmap";

const API_BASE = 'http://localhost:5000/api';

interface DashboardStats {
  totalStudyTime: number;
  weekStudyTime: number;
  todayStudyTime: number;
  totalSessions: number;
  weekSessionsCount: number;
  focusScore: number;
  streak: number;
  dailyGoal: number;
  dailyProgress: number;
  totalQuizzes: number;
  weekQuizzes: number;
  avgQuizScore: number;
  totalXP: number;
}

interface WeeklyProgress {
  day: string;
  minutes: number;
  date: string;
}

interface SubjectBreakdown {
  subject: string;
  minutes: number;
  sessions: number;
  percentage: number;
}

interface RecentSession {
  id: string;
  subject: string;
  topic: string;
  duration: number;
  date: string;
  mood: string;
}

interface RecentQuiz {
  id: string;
  topic: string;
  subject: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  xpEarned: number;
  date: string;
  difficulty: string;
}

interface AIInsight {
  type: 'tip' | 'warning' | 'achievement' | 'recommendation';
  title: string;
  description: string;
  icon: string;
}

interface HeatmapDay {
  date: string;
  minutes: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface AnalyticsData {
  stats: DashboardStats;
  weeklyProgress: WeeklyProgress[];
  subjectBreakdown: SubjectBreakdown[];
  recentSessions: RecentSession[];
  recentQuizzes: RecentQuiz[];
  moodAnalysis: { counts: Record<string, number>; weekSessions: number };
}

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];
const MOOD_COLORS: Record<string, string> = {
  great: '#22c55e',
  good: '#84cc16',
  neutral: '#eab308',
  tired: '#f97316',
  stressed: '#ef4444',
  focused: '#6366f1',
  productive: '#8b5cf6'
};

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);

  useEffect(() => {
    fetchAnalytics();
    fetchInsights();
    fetchHeatmap();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/analytics/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchHeatmap = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/analytics/heatmap`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const result = await res.json();
        setHeatmapData(result);
      }
    } catch (error) {
      console.error('Failed to fetch heatmap:', error);
    }
  };

  const fetchInsights = async () => {
    setInsightsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/analytics/insights`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const result = await res.json();
        setInsights(result.insights || []);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    return 'C';
  };

  if (loading) {
    return (
      <DashboardLayout userRole="student" userName={profile?.name || 'Student'}>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = data?.stats;
  const weeklyProgress = data?.weeklyProgress || [];
  const subjectBreakdown = data?.subjectBreakdown || [];
  const recentSessions = data?.recentSessions || [];
  const recentQuizzes = data?.recentQuizzes || [];
  const moodCounts = data?.moodAnalysis?.counts || {};

  // Prepare mood data for pie chart
  const moodData = Object.entries(moodCounts).map(([mood, count]) => ({
    name: mood.charAt(0).toUpperCase() + mood.slice(1),
    value: count,
    color: MOOD_COLORS[mood] || '#6b7280'
  }));

  return (
    <DashboardLayout userRole="student" userName={profile?.name || 'Student'}>
      {/* Header */}
      <div className="page-header animate-fade-in mb-8">
        <h1 className="page-title flex items-center gap-3">
          <BarChart3 className="h-10 w-10 text-primary" />
          Analytics
        </h1>
        <p className="page-description">Insights into your learning journey</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Weekly Study</p>
                <p className="text-3xl font-bold">{formatTime(stats?.weekStudyTime || 0)}</p>
                <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  {stats?.weekSessionsCount || 0} sessions
                </p>
              </div>
              <Clock className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quiz Average</p>
                <p className="text-3xl font-bold">{stats?.avgQuizScore || 0}%</p>
                <p className="text-xs text-purple-400 flex items-center gap-1 mt-1">
                  <Target className="h-3 w-3" />
                  {stats?.totalQuizzes || 0} quizzes
                </p>
              </div>
              <Target className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-3xl font-bold">{stats?.streak || 0} days</p>
                <p className="text-xs text-orange-400 flex items-center gap-1 mt-1">
                  <Award className="h-3 w-3" />
                  Keep it up!
                </p>
              </div>
              <Award className="h-10 w-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total XP</p>
                <p className="text-3xl font-bold">{stats?.totalXP || 0}</p>
                <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                  <Zap className="h-3 w-3" />
                  Level {Math.floor((stats?.totalXP || 0) / 1000) + 1}
                </p>
              </div>
              <Zap className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GitHub-Style Activity Heatmap */}
      <Card className="bg-elevated border-white/10 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Study Activity
          </CardTitle>
          <p className="text-xs text-muted-foreground">365-day contribution calendar</p>
        </CardHeader>
        <CardContent>
          <StudyHeatmap data={heatmapData} />
        </CardContent>
      </Card>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly Progress Bar Chart */}
        <Card className="bg-elevated border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyProgress}>
                <XAxis dataKey="day" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333' }}
                  formatter={(value: number) => [`${value} min`, 'Study Time']}
                />
                <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject Breakdown */}
        <Card className="bg-elevated border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Study Time by Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subjectBreakdown.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No study sessions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {subjectBreakdown.slice(0, 5).map((subject, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{subject.subject}</span>
                      <span className="text-sm text-muted-foreground">{formatTime(subject.minutes)}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${subject.percentage}%`,
                          backgroundColor: COLORS[i % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Mood Distribution */}
        <Card className="bg-elevated border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Mood Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {moodData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No mood data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={moodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {moodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333' }}
                    formatter={(value: number, name: string) => [`${value} sessions`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {moodData.map((mood, i) => (
                <div key={i} className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mood.color }} />
                  <span>{mood.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Goal Progress */}
        <Card className="bg-elevated border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Today's Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#333"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#6366f1"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(stats?.dailyProgress || 0) * 3.52} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{stats?.dailyProgress || 0}%</span>
                  <span className="text-xs text-muted-foreground">of goal</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                {formatTime(stats?.todayStudyTime || 0)} / {formatTime(stats?.dailyGoal || 120)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Focus Score */}
        <Card className="bg-elevated border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Focus Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48">
              <div className="text-6xl font-bold text-primary mb-2">
                {stats?.focusScore || 0}
              </div>
              <p className="text-sm text-muted-foreground">out of 100</p>
              <p className="text-xs text-center text-muted-foreground mt-4">
                Based on average session length
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="bg-elevated border-white/10 mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInsights}
            disabled={insightsLoading}
          >
            {insightsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Study more to get personalized insights!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.slice(0, 4).map((insight, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{insight.icon}</span>
                    <div>
                      <h4 className="font-semibold text-sm">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <Card className="bg-elevated border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No sessions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{session.subject}</h4>
                      <p className="text-xs text-muted-foreground">{session.topic}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{session.duration}m</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Quizzes */}
        <Card className="bg-elevated border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Recent Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentQuizzes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No quizzes yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentQuizzes.map((quiz, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{quiz.topic}</h4>
                      <p className="text-xs text-muted-foreground">{quiz.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${quiz.score >= 80 ? 'text-green-400' : quiz.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {quiz.score}%
                      </p>
                      <p className="text-xs text-muted-foreground">+{quiz.xpEarned} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
