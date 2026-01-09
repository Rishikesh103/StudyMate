import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import {
  Calendar,
  Brain,
  CheckCircle,
  Clock,
  Flame,
  TrendingUp,
  Star,
  Plus,
  Loader2,
  ChevronRight,
  AlertCircle,
  Trophy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const API_BASE = 'http://localhost:5000/api';

interface ReviewHistory {
  date: string;
  quality: number;
  timeSpent: number;
  notes?: string;
}

interface RevisionTopic {
  _id: string;
  subject: string;
  topicName: string;
  nextReview: string;
  lastReviewed?: string;
  repetitionNumber: number;
  easinessFactor: number;
  interval: number;
  status: 'pending' | 'reviewed' | 'skipped' | 'mastered';
  priority: 'low' | 'medium' | 'high';
  mastered: boolean;
  reviewHistory: ReviewHistory[];
}

interface RevisionStats {
  total: number;
  mastered: number;
  overdue: number;
  active: number;
  compliance: number;
  avgQuality: number;
  streak: number;
  totalReviews: number;
}

export default function RevisionPlannerPage() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [todayRevisions, setTodayRevisions] = useState<RevisionTopic[]>([]);
  const [overdueRevisions, setOverdueRevisions] = useState<RevisionTopic[]>([]);
  const [upcomingRevisions, setUpcomingRevisions] = useState<RevisionTopic[]>([]);
  const [stats, setStats] = useState<RevisionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [currentReview, setCurrentReview] = useState<RevisionTopic | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<number | null>(null);

  useEffect(() => {
    fetchRevisions();
    fetchStats();
  }, []);

  const fetchRevisions = async () => {
    try {
      const token = localStorage.getItem('token');

      const [todayRes, overdueRes, upcomingRes] = await Promise.all([
        fetch(`${API_BASE}/revision/today`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/revision/overdue`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/revision/upcoming?days=7`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (todayRes.ok) setTodayRevisions(await todayRes.json());
      if (overdueRes.ok) setOverdueRevisions(await overdueRes.json());
      if (upcomingRes.ok) {
        const upcoming = await upcomingRes.json();
        // Filter out today and overdue from upcoming
        const filtered = upcoming.filter((r: RevisionTopic) => {
          const reviewDate = new Date(r.nextReview);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return reviewDate >= tomorrow;
        });
        setUpcomingRevisions(filtered);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/revision/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setStats(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const startReview = (topic: RevisionTopic) => {
    setCurrentReview(topic);
    setSelectedQuality(null);
    setReviewing(true);
  };

  const submitReview = async () => {
    if (!currentReview || selectedQuality === null) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/revision/${currentReview._id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quality: selectedQuality, timeSpent: 0 })
      });

      if (!res.ok) throw new Error('Failed to submit review');

      const data = await res.json();
      toast({
        title: "Review Recorded!",
        description: data.message,
        variant: data.revision.mastered ? "default" : "default"
      });

      setReviewing(false);
      setCurrentReview(null);
      fetchRevisions();
      fetchStats();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const qualityOptions = [
    { value: 0, label: "Complete Blackout", emoji: "😵", color: "bg-red-500" },
    { value: 1, label: "Incorrect, Familiar", emoji: "😕", color: "bg-orange-500" },
    { value: 2, label: "Incorrect, Easy Recall", emoji: "🤔", color: "bg-yellow-500" },
    { value: 3, label: "Correct, Difficult", emoji: "😅", color: "bg-blue-500" },
    { value: 4, label: "Correct, Hesitation", emoji: "😊", color: "bg-green-500" },
    { value: 5, label: "Perfect Recall", emoji: "🎯", color: "bg-purple-500" }
  ];

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
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

  // Review Modal
  if (reviewing && currentReview) {
    return (
      <DashboardLayout userRole="student" userName={profile?.name || 'Student'}>
        <div className="max-w-2xl mx-auto py-8">
          <Card className="bg-elevated border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl">Reviewing: {currentReview.topicName}</CardTitle>
              <CardDescription>{currentReview.subject}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Repetition #{currentReview.repetitionNumber + 1}
                </p>
                <p className="text-lg font-medium mb-4">
                  How well did you recall this topic?
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {qualityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedQuality(option.value)}
                      style={{
                        backgroundColor: selectedQuality === option.value
                          ? (option.value <= 2 ? '#ef4444' : option.value === 3 ? '#3b82f6' : option.value === 4 ? '#22c55e' : '#a855f7')
                          : '#1e1e2e',
                        color: 'white'
                      }}
                      className={`p-4 rounded-xl border-2 transition-all ${selectedQuality === option.value
                        ? 'border-white scale-105 shadow-lg'
                        : 'border-white/20 hover:border-primary/60 hover:scale-105'
                        }`}
                    >
                      <div className="text-3xl mb-2">{option.emoji}</div>
                      <div className="text-sm font-semibold" style={{ color: 'white' }}>{option.label}</div>
                      <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Quality: {option.value}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={submitReview}
                  disabled={selectedQuality === null}
                  style={{
                    background: selectedQuality !== null
                      ? 'linear-gradient(to right, #7c3aed, #4f46e5)'
                      : '#374151',
                    color: selectedQuality !== null ? 'white' : '#9ca3af'
                  }}
                  className="flex-1 py-4 px-8 rounded-xl font-bold text-lg transition-all hover:opacity-90 hover:scale-[1.02] disabled:cursor-not-allowed"
                >
                  ✓ Submit Review
                </button>
                <button
                  onClick={() => setReviewing(false)}
                  style={{ backgroundColor: '#1f2937', color: 'white' }}
                  className="py-4 px-8 rounded-xl font-semibold text-lg border-2 border-white/20 hover:border-white/40 transition-all"
                >
                  Cancel
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="student" userName={profile?.name || 'Student'}>
      <div className="page-header animate-fade-in mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="page-title flex items-center gap-3">
              <Brain className="h-10 w-10 text-primary" />
              Revision Planner
            </h1>
            <p className="page-description">Spaced repetition for better memory retention</p>
          </div>
          <Button onClick={() => window.location.href = '/roadmap'}>
            <Plus className="mr-2 h-4 w-4" />
            Add Topics
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-3xl font-bold">{stats?.streak || 0}</p>
              </div>
              <Flame className="h-10 w-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mastered</p>
                <p className="text-3xl font-bold">{stats?.mastered || 0}</p>
              </div>
              <Trophy className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance</p>
                <p className="text-3xl font-bold">{stats?.compliance || 0}%</p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Quality</p>
                <p className="text-3xl font-bold">{stats?.avgQuality?.toFixed(1) || 0}</p>
              </div>
              <Star className="h-10 w-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue */}
      {overdueRevisions.length > 0 && (
        <Card className="mb-6 border-red-500/30 bg-red-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              Overdue Revisions ({overdueRevisions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueRevisions.map((topic) => (
              <div
                key={topic._id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-semibold">{topic.topicName}</h4>
                  <p className="text-sm text-muted-foreground">{topic.subject}</p>
                </div>
                <div className="text-right mr-4">
                  <p className="text-sm font-medium text-red-500">{getDaysUntil(topic.nextReview)}</p>
                  <p className="text-xs text-muted-foreground">Rep #{topic.repetitionNumber}</p>
                </div>
                <Button onClick={() => startReview(topic)} size="sm">
                  Review Now
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Revisions */}
        <Card className="bg-elevated border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Revisions ({todayRevisions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayRevisions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>All caught up for today! 🎉</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayRevisions.map((topic) => (
                  <div
                    key={topic._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => startReview(topic)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{topic.topicName}</h4>
                      <p className="text-sm text-muted-foreground">{topic.subject}</p>
                    </div>
                    <Badge variant={topic.priority === 'high' ? 'destructive' : 'secondary'}>
                      {topic.priority}
                    </Badge>
                    <ChevronRight className="h-5 w-5 ml-2 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card className="bg-elevated border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Upcoming (Next 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingRevisions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No upcoming revisions</p>
                <p className="text-sm mt-2">Add topics from your roadmap to get started!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {upcomingRevisions.slice(0, 10).map((topic) => (
                  <div
                    key={topic._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => startReview(topic)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{topic.topicName}</h4>
                      <p className="text-xs text-muted-foreground">{topic.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{getDaysUntil(topic.nextReview)}</p>
                      <p className="text-xs text-muted-foreground">Click to review early</p>
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
