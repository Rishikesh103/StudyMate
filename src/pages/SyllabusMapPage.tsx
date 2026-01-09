import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Map, CheckCircle, Circle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Topic {
  _id: string;
  name: string;
  isCompleted: boolean;
}

interface Subject {
  _id: string;
  name: string;
  progress: number;
  topics: Topic[];
}

interface RoadmapData {
  _id: string;
  title: string;
  subjects: Subject[];
  overallProgress: number;
}

const API_BASE = 'http://localhost:5000/api';

export default function SyllabusMapPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [roadmaps, setRoadmaps] = useState<RoadmapData[]>([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoadmap();
  }, []);

  // Update displayed roadmap when selection changes
  useEffect(() => {
    if (selectedRoadmapId && roadmaps.length > 0) {
      const selected = roadmaps.find(r => r._id === selectedRoadmapId);
      setRoadmap(selected || null);
    }
  }, [selectedRoadmapId, roadmaps]);

  const fetchRoadmap = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/users/roadmap/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRoadmaps(data);

        // Auto-select first roadmap or restore from localStorage
        if (data && data.length > 0) {
          const savedId = localStorage.getItem('selectedRoadmapId');
          const idToSelect = (savedId && data.find((r: any) => r._id === savedId))
            ? savedId
            : data[0]._id;

          setSelectedRoadmapId(idToSelect);
          setRoadmap(data.find((r: any) => r._id === idToSelect));
        }
      }
    } catch (error) {
      console.error("Failed to fetch syllabus map", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoadmapChange = (roadmapId: string) => {
    setSelectedRoadmapId(roadmapId);
    localStorage.setItem('selectedRoadmapId', roadmapId);
  };

  const toggleTopic = async (subjectId: string, topicId: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      const newStatus = !currentStatus;

      // Update local state immediately for responsiveness
      if (roadmap) {
        const newSubjects = roadmap.subjects.map(sub => {
          if (sub._id === subjectId) {
            const newTopics = sub.topics.map(t =>
              t._id === topicId ? { ...t, isCompleted: newStatus } : t
            );
            // Recalculate local progress for smooth UI
            const completedCount = newTopics.filter(t => t.isCompleted).length;
            const newProgress = Math.round((completedCount / newTopics.length) * 100);

            return { ...sub, topics: newTopics, progress: newProgress };
          }
          return sub;
        });
        setRoadmap({ ...roadmap, subjects: newSubjects });
      }

      // Send to backend
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/users/roadmap/${roadmap._id}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subjectId, topicId, isCompleted: newStatus })
      });

      if (res.ok) {
        const data = await res.json();
        // Sync with server state to ensure accuracy
        setRoadmap(data.roadmap);
      } else {
        // Revert on failure (optional, but good practice)
        toast({ title: "Error", description: "Failed to update progress", variant: "destructive" });
        fetchRoadmap();
      }
    } catch (error) {
      console.error("Failed to update progress", error);
      toast({ title: "Error", description: "Failed to update progress", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout userRole="student" userName={profile?.name || 'Student'}>
      <div className="page-header animate-fade-in mb-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="page-title flex items-center gap-3">
              <Map className="h-10 w-10 text-primary" />
              Syllabus Map
            </h1>
            <p className="page-description">
              Track your curriculum coverage across all subjects.
            </p>
          </div>
          {roadmap && (
            <div className="text-right">
              <span className="text-3xl font-bold text-primary">{roadmap.overallProgress}%</span>
              <p className="text-sm text-muted-foreground">Total Completion</p>
            </div>
          )}
        </div>
      </div>

      {/* Roadmap Selector - Modern Card Design */}
      {roadmaps.length > 1 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Your Roadmaps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roadmaps.map((r) => (
              <Card
                key={r._id}
                onClick={() => handleRoadmapChange(r._id)}
                className={`cursor-pointer transition-all hover:scale-105 ${selectedRoadmapId === r._id
                  ? 'bg-primary/20 border-primary ring-2 ring-primary/50'
                  : 'bg-elevated border-white/10 hover:border-primary/50'
                  }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg truncate flex-1">{r.title}</h3>
                    {selectedRoadmapId === r._id && (
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <span>{r.subjects?.length || 0} subjects</span>
                    <span>•</span>
                    <span className="text-primary font-medium">{r.overallProgress}%</span>
                  </div>
                  {/* Raw progress bar with inline styles for proper rendering */}
                  <div
                    className="relative h-2 rounded-full overflow-hidden"
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 h-full bg-primary transition-all"
                      style={{ width: `${r.overallProgress}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar OUTSIDE page-header for full width */}
      {roadmap && (
        <div className="mb-8" style={{ width: '100%' }}>
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="text-muted-foreground">Overall Completion</span>
            <span className="text-primary">{roadmap.overallProgress}%</span>
          </div>
          {/* Raw progress bar with inline styles to guarantee full width */}
          <div
            className="relative h-4 rounded-full overflow-hidden"
            style={{ width: '100%', backgroundColor: '#3f3f46' }}
          >
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${roadmap.overallProgress}%` }}
            />
          </div>
        </div>
      )
      }

      {
        loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : !roadmap || !roadmap.subjects || roadmap.subjects.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
            <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">Map Not Generated</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Upload your syllabus in the Roadmap section to realize this map!
            </p>
            <Link to="/roadmap">
              <Button className="gap-2">
                Go to Roadmap <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {roadmap.subjects.map((subject, i) => (
              <div key={subject._id} className="card animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="card-header">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="card-title text-xl">{subject.name}</h3>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium border border-primary/20">
                      {subject.progress}% Complete
                    </span>
                  </div>
                  <div className="relative h-2 bg-secondary/30 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 ease-out"
                      style={{ width: `${subject.progress}%` }}
                    />
                  </div>
                </div>
                <div className="card-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {subject.topics.map((topic) => (
                      <div
                        key={topic._id}
                        className={`flex items-center gap-3 p-3 border rounded-lg transition-all cursor-pointer group hover:bg-white/10 ${topic.isCompleted
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-white/5 border-white/5 opacity-75 hover:opacity-100'
                          }`}
                        onClick={() => toggleTopic(subject._id, topic._id, topic.isCompleted)}
                      >
                        {topic.isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
                        )}
                        <span className={`font-medium ${topic.isCompleted ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                          {topic.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </DashboardLayout >
  );
}
