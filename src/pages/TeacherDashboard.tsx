import { useState, useEffect } from "react";
import { Clock, BookOpen, Target, TrendingUp, Brain, MessageSquare, Download, Loader2, Users } from "lucide-react";
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

interface StudentInfo {
  _id: string;
  name: string;
}

export default function TeacherDashboard() {
  const { profile, user } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>('');
  const [stats, setStats] = useState<Stats>({
    totalStudyTime: 0, topicsCompleted: 0, averageQuizScore: 0, consistency: 0,
  });
  const [weeklyData, setWeeklyData] = useState([{ day: 'Mon', hours: 0 }]);
  const [topicMasteryData, setTopicMasteryData] = useState<TopicMastery[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchAllStudents();
  }, [user]);

  useEffect(() => {
    if (selectedStudentId) fetchStudentData(selectedStudentId);
  }, [selectedStudentId]);

  const fetchAllStudents = async () => {
    // Mock logic for brevity
    setTimeout(() => {
      setStudents([{ _id: '1', name: 'John Doe' }]);
      setSelectedStudentId('1');
      setSelectedStudentName('John Doe');
      setIsLoading(false);
    }, 500);
  };

  const fetchStudentData = async (studentId: string) => {
    setIsLoading(true);
    // Mock logic
    setTimeout(() => {
      setStats({ totalStudyTime: 15, topicsCompleted: 8, averageQuizScore: 82, consistency: 90 });
      setWeeklyData([{ day: 'Mon', hours: 2 }, { day: 'Tue', hours: 3 }]);
      setTopicMasteryData([{ subject: 'Math', mastery: 75 }]);
      setIsLoading(false);
    }, 500);
  };

  const handleSubmitFeedback = async () => {
    // Mock submit
    setIsSubmitting(true);
    setTimeout(() => {
      toast({ title: "Feedback submitted", description: "Saved successfully" });
      setIsSubmitting(false);
      setFeedback('');
    }, 1000);
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      toast({ title: "Report Exported", description: "Download started." });
      setIsExporting(false);
    }, 1000);
  };

  return (
    <DashboardLayout userRole="teacher" userName={profile?.name || 'Teacher'} userAvatar={profile?.avatar_url || undefined}>
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-primary">Student Progress Overview</h1>
              <p className="text-muted">Monitor and manage student performance</p>
            </div>
            <Button onClick={handleExportPDF} disabled={isExporting}>
              {isExporting ? <Loader2 className="animate-spin inline mr-2" /> : <Download className="inline mr-2" />} Export
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader><CardTitle>Select Student</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {students.map(student => (
                  <button
                    key={student._id}
                    onClick={() => { setSelectedStudentId(student._id); setSelectedStudentName(student.name); }}
                    className={`px-4 py-2 rounded-lg border ${selectedStudentId === student._id ? 'bg-primary text-white' : 'bg-secondary'}`}
                  >
                    {student.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Study Time" value={`${stats.totalStudyTime}h`} subtitle="This week" icon={Clock} />
            <StatCard title="Topics" value={stats.topicsCompleted} subtitle="Covered" icon={BookOpen} />
            <StatCard title="Quiz Avg" value={`${stats.averageQuizScore}%`} subtitle="Score" icon={Target} />
            <StatCard title="Consistency" value={`${stats.consistency}%`} subtitle="Score" icon={TrendingUp} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Weekly Study Hours</CardTitle></CardHeader>
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
              <CardHeader><CardTitle>Subject Mastery</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  {topicMasteryData.map((s, idx) => (
                    <div key={idx}>
                      <ProgressRing progress={s.mastery} size={80} strokeWidth={6} />
                      <p className="mt-2 text-sm font-medium">{s.subject}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Add Feedback</CardTitle></CardHeader>
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
