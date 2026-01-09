import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Clock, BookOpen, Target, TrendingUp, Zap, Award,
  Plus, Calendar, Brain, Sparkles, ChevronRight
} from "lucide-react";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, Line } from "recharts";

const API_BASE = 'http://localhost:5000/api';

export default function StudentDashboard() {
  const { profile, user } = useAuth();
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [aiInsights, setAiInsights] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<unknown[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (analytics && analytics.stats) {
      fetchAIInsights();
    }
  }, [analytics]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`${API_BASE}/analytics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      const error = err as Error;
      console.error('Dashboard error:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsights = async () => {
    try {
      setInsightsLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/analytics/insights`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAiInsights(data.insights || []);
      }
    } catch (err) {
      console.error('AI Insights error:', err);
      // Keep empty array if AI fails
    } finally {
      setInsightsLoading(false);
    }
  };

  // Format time helper
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Format date helper  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Send chat message to RAG-powered AI
  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/analytics/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: chatInput,
          conversationHistory: chatMessages
        })
      });

      const data = await response.json();

      if (data.success && data.answer) {
        const aiMessage = { role: 'assistant', content: data.answer, sources: data.sources };
        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = { role: 'assistant', content: data.answer || "Sorry, I couldn't process that question." };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = { role: 'assistant', content: "I'm having trouble right now. Please try again." };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="student" userName={profile?.name || 'Student'}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="spinner-border text-primary mb-4"></div>
            <p className="text-secondary">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="student" userName={profile?.name || 'Student'}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-danger mb-4">Error: {error}</p>
            <button onClick={fetchDashboardData} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics || !analytics.stats) {
    return (
      <DashboardLayout userRole="student" userName={profile?.name || 'Student'}>
        <div className="page-header">
          <h1 className="page-title">Welcome back, {profile?.name?.split(' ')[0] || 'Student'}!</h1>
          <p className="page-description">Start logging your first study session to see analytics here.</p>
        </div>
        <div className="card text-center p-8">
          <Brain className="h-16 w-16 mx-auto text-primary mb-4" />
          <h3 className="text-xl font-bold mb-2">No study data yet</h3>
          <p className="text-secondary mb-4">Log your first study session to unlock insights and analytics!</p>
          <a href="/study-log" className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Log Study Session
          </a>
        </div>
      </DashboardLayout>
    );
  }

  const { stats, weeklyProgress, subjectBreakdown, recentSessions } = analytics;

  return (
    <DashboardLayout userRole="student" userName={profile?.name || 'Student'}>
      {/* Header */}
      <div className="page-header animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">
              Welcome back, {profile?.name?.split(' ')[0] || 'Student'}!
            </h1>
            <p className="page-description">
              Here's what's happening with your studies today.
            </p>
          </div>
          <a href="/study-log" className="btn btn-primary">
            <Plus className="h-5 w-5 mr-2" />
            Log Session
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid animate-fade-in" style={{ animationDelay: '100ms' }}>
        {/* Study Time */}
        <div className="stat-card hover-lift">
          <div className="stat-header">
            <span className="stat-label">Study Time</span>
            <div className="stat-icon"><Clock className="h-5 w-5" /></div>
          </div>
          <div className="stat-value">{formatTime(stats.weekStudyTime)}</div>
          <div className="stat-change positive">
            <TrendingUp className="h-4 w-4" />
            <span>This week</span>
          </div>
        </div>

        {/* Sessions */}
        <div className="stat-card hover-lift">
          <div className="stat-header">
            <span className="stat-label">Sessions</span>
            <div className="stat-icon"><BookOpen className="h-5 w-5" /></div>
          </div>
          <div className="stat-value">{stats.totalSessions}</div>
          <div className="stat-change positive">
            <span>All time</span>
          </div>
        </div>

        {/* Focus Score */}
        <div className="stat-card hover-lift">
          <div className="stat-header">
            <span className="stat-label">Focus Score</span>
            <div className="stat-icon"><Target className="h-5 w-5" /></div>
          </div>
          <div className="stat-value">{stats.focusScore}%</div>
          <div className="stat-change positive">
            <Zap className="h-4 w-4" />
            <span>Excellent!</span>
          </div>
        </div>

        {/* Study Streak */}
        <div className="stat-card hover-lift">
          <div className="stat-header">
            <span className="stat-label">Study Streak</span>
            <div className="stat-icon"><Award className="h-5 w-5" /></div>
          </div>
          <div className="stat-value">{stats.streak}</div>
          <div className="stat-change positive">
            <span>{stats.streak === 1 ? 'day' : 'days'}</span>
          </div>
        </div>
      </div>

      {/* Quiz Performance Card */}
      {stats.quizzesCompleted > 0 && (
        <div className="card card-gradient animate-fade-in mb-6" style={{ animationDelay: '150ms' }}>
          <div className="card-header">
            <h3 className="card-title text-white flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Quiz Performance
            </h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-3 gap-4 text-center text-white">
              <div>
                <div className="text-3xl font-bold">{stats.quizzesCompleted}</div>
                <div className="text-sm opacity-90">Quizzes</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.avgQuizScore}%</div>
                <div className="text-sm opacity-90">Avg Score</div>
              </div>
              <div>
                <div className="text-3xl font-bold">+{stats.xpFromQuizzes}</div>
                <div className="text-sm opacity-90">XP Earned</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* Left Column - Charts */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">

          {/* Daily Goal Progress */}
          <div className="card card-glass animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="card-header">
              <h3 className="card-title">Today's Goal</h3>
              <span className="text-sm text-secondary">
                {formatTime(stats.todayStudyTime)} / {formatTime(stats.dailyGoal)}
              </span>
            </div>
            <div className="card-content">
              <div className="progress" style={{ height: '24px' }}>
                <div
                  className="progress-bar"
                  style={{ width: `${stats.dailyProgress}%` }}
                  aria-valuenow={stats.dailyProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  {stats.dailyProgress}%
                </div>
              </div>
              <p className="text-xs text-tertiary mt-2">
                {stats.dailyProgress >= 100
                  ? '🎉 Goal achieved! Great job!'
                  : `${stats.dailyGoal - stats.todayStudyTime} minutes to go`
                }
              </p>
            </div>
          </div>

          {/* Weekly Progress Chart */}
          <div className="card animate-fade-in" style={{ animationDelay: '250ms' }}>
            <div className="card-header">
              <h3 className="card-title">Weekly Progress</h3>
              <span className="text-sm text-secondary">{formatTime(stats.weekStudyTime)} this week</span>
            </div>
            <div className="card-content">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyProgress}>
                  <XAxis dataKey="day" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value} min`, 'Study Time']}
                  />
                  <Line
                    type="monotone"
                    dataKey="minutes"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ fill: 'var(--primary)', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="card animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="card-header">
              <h3 className="card-title">Recent Sessions</h3>
              <a href="/study-log" className="text-primary text-sm hover:underline flex items-center gap-1">
                View All
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
            <div className="card-content">
              {recentSessions.length === 0 ? (
                <p className="text-secondary text-center py-4">No sessions yet</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentSessions.map((session: unknown) => {
                    const sess = session as { id: string; subject: string; topic: string; duration: number; date: string; mood?: string; };
                    (
                    <div key={sess.id} className="flex items-center gap-3 p-3 rounded-lg bg-elevated/50 hover:bg-elevated transition-all cursor-pointer">
                      <div className="flex-1">
                        <p className="font-medium text-primary">{sess.subject}</p>
                        <p className="text-xs text-secondary">{sess.topic} • {formatTime(sess.duration)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-tertiary">{formatDate(sess.date)}</p>
                        {sess.mood && (
                          <span className="text-lg">{
                            sess.mood === 'great' ? '😄' :
                              sess.mood === 'good' ? '🙂' :
                                sess.mood === 'neutral' ? '😐' :
                                  sess.mood === 'tired' ? '😴' : '😰'
                          }</span>
                        )}
                      </div>
                    </div>)
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Insights & Subject Breakdown */}
        <div className="flex flex-col gap-6">




          {/* AI-Powered Smart Insights */}
          <div className="card card-glass animate-fade-in" style={{ animationDelay: '350ms' }}>
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                Smart Insights
                {insightsLoading && <span className="text-xs text-tertiary">(Loading...)</span>}
              </h3>
            </div>
            <div className="card-content">
              {insightsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-secondary text-sm">Analyzing your study patterns...</div>
                </div>
              ) : aiInsights.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {aiInsights.map((insight, index) => {
                    const Icon = insight.icon === 'Zap' ? Zap :
                      insight.icon === 'Target' ? Target :
                        insight.icon === 'Award' ? Award : Brain;

                    const colorClass = insight.type === 'success' ? 'bg-success/10' :
                      insight.type === 'warning' ? 'bg-warning/10' :
                        'bg-info/10';

                    const iconColor = insight.type === 'success' ? 'text-success' :
                      insight.type === 'warning' ? 'text-warning' :
                        'text-info';

                    return (
                      <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${colorClass}`}>
                        <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                        <p className="text-sm text-secondary">{insight.text}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {stats.weekStudyTime > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10">
                      <Zap className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-secondary">
                        You've studied {formatTime(stats.weekStudyTime)} this week! Keep up the great work!
                      </p>
                    </div>
                  )}
                  {subjectBreakdown.length > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-info/10">
                      <Brain className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-secondary">
                        Top subject: {subjectBreakdown[0].subject} ({subjectBreakdown[0].percentage}% of your time)
                      </p>
                    </div>
                  )}
                  {subjectBreakdown.length > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-info/10">
                      <Brain className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-secondary">
                        Top subject: {subjectBreakdown[0].subject} ({subjectBreakdown[0].percentage}% of your time)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-white/10 my-4"></div>

              {/* Clean Chat Interface */}
              <div className="space-y-3">
                {/* Chat Messages */}
                <div
                  className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-1"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(var(--primary-rgb), 0.2) transparent'
                  }}
                >
                  {chatMessages.length === 0 ? (
                    // Suggestion Pills
                    <div className="space-y-2">
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Ask about your studies:</p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setChatInput("What's my best study day?")}
                          className="text-left px-3 py-3 rounded-lg text-xs transition-all group"
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-light)'
                          }}
                        >
                          <span className="group-hover:translate-x-1 transition-transform inline-block">What's my best study day?</span>
                        </button>
                        <button
                          onClick={() => setChatInput("Which subject needs more focus?")}
                          className="text-left px-3 py-3 rounded-lg text-xs transition-all group"
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-light)'
                          }}
                        >
                          <span className="group-hover:translate-x-1 transition-transform inline-block">Which subject needs more focus?</span>
                        </button>
                        <button
                          onClick={() => setChatInput("How can I improve my study streak?")}
                          className="text-left px-3 py-3 rounded-lg text-xs transition-all group"
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-light)'
                          }}
                        >
                          <span className="group-hover:translate-x-1 transition-transform inline-block">How can I improve my study streak?</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Messages
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className="max-w-[85%] rounded-lg px-3 py-2 text-sm"
                          style={{
                            backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-elevated)',
                            color: msg.role === 'user' ? '#FFFFFF' : 'var(--text-secondary)',
                            border: msg.role === 'user' ? 'none' : '1px solid var(--border-light)'
                          }}
                        >
                          <p className="leading-relaxed">{msg.content}</p>
                          {msg.sources > 0 && (
                            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                              Based on {msg.sources} study session{msg.sources > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Loading State */}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-elevated border border-white/10 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                          <span className="text-xs text-tertiary">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !chatLoading && sendChatMessage()}
                    placeholder="Ask about your study patterns..."
                    className="flex-1 px-4 py-3 rounded-lg text-sm focus:outline-none transition-all font-medium"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-light)',
                      height: '44px' // Explicit height match
                    }}
                    disabled={chatLoading}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={chatLoading || !chatInput.trim()}
                    className="flex items-center justify-center px-4 rounded-lg transition-colors flex-shrink-0"
                    style={{
                      backgroundColor: !chatInput.trim() ? 'var(--bg-elevated)' : 'var(--primary)',
                      color: !chatInput.trim() ? 'var(--text-tertiary)' : '#FFFFFF',
                      height: '44px', // Explicit height match
                      opacity: chatLoading ? 0.7 : 1,
                      cursor: (chatLoading || !chatInput.trim()) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>


          {/* Subject Breakdown */}
          <div className="card animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="card-header">
              <h3 className="card-title">Subject Focus</h3>
            </div>
            <div className="card-content">
              {subjectBreakdown.length === 0 ? (
                <p className="text-secondary text-center py-4">No data yet</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {subjectBreakdown.map((subject: unknown, index: number) => {
                    const subj = subject as { subject: string; minutes: number; percentage: number; };
                    (
                    <div key={subj.subject}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{subj.subject}</span>
                        <span className="text-sm text-secondary">{formatTime(subj.minutes)}</span>
                      </div>
                      <div className="progress">
                        <div
                          className="progress-bar"
                          style={{ width: `${subj.percentage}%` }}
                        />
                      </div>
                    </div>)
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
