import { useState, useEffect } from "react";
import { Clock, BookOpen, Target, TrendingUp, Brain, MessageSquare, Download, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BurnoutIndicator } from "@/components/dashboard/BurnoutIndicator";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";

interface Stats {
  totalStudyTime: number;
  topicsCompleted: number;
  averageQuizScore: number;
  consistency: number;
}

interface TopicMastery {
  subject: string;
  mastery: number;
}

export default function ParentDashboard() {
  const { profile, user } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalStudyTime: 0,
    topicsCompleted: 0,
    averageQuizScore: 0,
    consistency: 0,
  });
  const [weeklyData, setWeeklyData] = useState([
    { day: 'Mon', hours: 0 },
  ]);
  const [topicMasteryData, setTopicMasteryData] = useState<TopicMastery[]>([]);
  const [linkedStudents, setLinkedStudents] = useState<{ _id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ _id: string; name: string }[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const hasData = stats.totalStudyTime > 0;
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchLinkedStudents().then(() => {
        fetchStudentData();
      });
    }
  }, [user]);

  const fetchStudentData = async (studentId?: string | null) => {
    setIsLoading(true);
    // Mock data for refactor stability
    setTimeout(() => {
      setStats({ totalStudyTime: 12, topicsCompleted: 5, averageQuizScore: 78, consistency: 85 });
      setWeeklyData([{ day: 'Mon', hours: 2.5 }, { day: 'Tue', hours: 3 }]);
      setTopicMasteryData([{ subject: 'Math', mastery: 80 }, { subject: 'Science', mastery: 70 }]);
      setIsLoading(false);
    }, 500);
  };

  const fetchLinkedStudents = async () => {
    // Mock logic
    setLinkedStudents([{ _id: '1', name: 'Child 1' }]);
    if (!selectedStudentId) setSelectedStudentId('1');
  };

  const searchProfiles = async (query: string) => {
    setSearchQuery(query);
  };

  const linkStudent = async (studentId: string) => {
    toast({ title: 'Linked', description: 'Student linked successfully.' });
  };

  const unlinkStudent = async (studentId: string) => {
    toast({ title: 'Unlink', description: 'Unlinking is not yet supported in this version.', variant: 'default' });
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback empty",
        description: "Please write some feedback before submitting.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      toast({ title: "Feedback submitted! ✅", description: "Your feedback has been saved." });
      setFeedback('');
      setIsSubmitting(false);
    }, 800);
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: "Report downloaded! 📄",
        description: "The performance report has been saved to your device.",
      });
    }, 1500);
  };

  return (
    <DashboardLayout userRole="parent" userName={profile?.name || 'Parent'} userAvatar={profile?.avatar_url || undefined}>
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-primary">Student Progress</h1>
              <p className="text-muted">
                Weekly performance overview
              </p>
            </div>
            <Button onClick={handleExportPDF} disabled={isExporting}>
              {isExporting ? <Loader2 className="animate-spin inline mr-2" /> : <Download className="inline mr-2" />} Export Report
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Manage Linked Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => searchProfiles(e.target.value)}
                    className="flex-1 input"
                  />
                  <Button disabled>Quick Link</Button>
                </div>
                <div>
                  <p className="text-sm text-muted mb-2">Linked Students</p>
                  <div className="flex flex-wrap gap-2">
                    {linkedStudents.map(s => (
                      <div key={s._id} className="flex items-center gap-2 px-3 py-1 rounded bg-secondary">
                        <span>{s.name}</span>
                        <Button size="sm" variant="destructive" onClick={() => unlinkStudent(s._id)}>Unlink</Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Study Time" value={`${stats.totalStudyTime}h`} subtitle="This week" icon={Clock} delay={0} />
            <StatCard title="Topics Covered" value={stats.topicsCompleted} subtitle="This week" icon={BookOpen} color="accent" delay={0.1} />
            <StatCard title="Quiz Average" value={`${stats.averageQuizScore}%`} subtitle="Performance" icon={Target} color="success" delay={0.2} />
            <StatCard title="Consistency" value={`${stats.consistency}%`} subtitle="Score" icon={TrendingUp} color="warning" delay={0.3} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Weekly Study Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <BurnoutIndicator level={stats.totalStudyTime > 20 ? "medium" : "low"} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subject Mastery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {topicMasteryData.map((s, idx) => (
                    <div key={idx} className="text-center">
                      <ProgressRing progress={s.mastery} size={80} strokeWidth={6} />
                      <p className="mt-2 text-sm font-medium">{s.subject}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  placeholder="Ms. Doe, good job on..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full textarea mb-4"
                />
                <Button className="w-full" onClick={handleSubmitFeedback} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
