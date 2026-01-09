import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Calendar, Upload, CheckCircle2, Circle, ChevronDown, ChevronRight, Loader2, Trash2, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const API_BASE = 'http://localhost:5000/api';

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
    createdAt: string;
}

export default function RoadmapPage() {
    const { profile } = useAuth();
    const { toast } = useToast();

    const [roadmaps, setRoadmaps] = useState<RoadmapData[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [expandedRoadmaps, setExpandedRoadmaps] = useState<Record<string, boolean>>({});
    const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchRoadmaps();
    }, []);

    const fetchRoadmaps = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/users/roadmap/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                if (res.status === 404) {
                    setRoadmaps([]);
                    return;
                }
                throw new Error('Failed to fetch roadmaps');
            }

            const data = await res.json();
            setRoadmaps(data);
        } catch (error: any) {
            console.error('Fetch error:', error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const toggleRoadmap = (id: string) => {
        setExpandedRoadmaps(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleSubject = (id: string) => {
        setExpandedSubjects(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/users/roadmap/scan`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) throw new Error('Failed to upload file');

            const data = await res.json();
            toast({ title: "Success", description: "Roadmap generated successfully!" });
            fetchRoadmaps(); // Refresh list
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const toggleTopic = async (roadmapId: string, subjectId: string, topicId: string, currentStatus: boolean) => {
        try {
            console.log('Toggling topic:', { roadmapId, subjectId, topicId, currentStatus });
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/users/roadmap/${roadmapId}/progress`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subjectId,
                    topicId,
                    isCompleted: !currentStatus
                })
            });

            const data = await res.json();
            console.log('Toggle response:', data);

            if (!res.ok) {
                throw new Error(data.message || 'Failed to update progress');
            }

            toast({ title: "Success", description: "Progress updated" });
            fetchRoadmaps(); // Refresh to show updated progress
        } catch (error: any) {
            console.error('Toggle error:', error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDeleteRoadmap = async (roadmapId: string, title: string) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/users/roadmap/${roadmapId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error('Failed to delete roadmap');

            toast({ title: "Success", description: "Roadmap deleted successfully" });
            fetchRoadmaps();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const addToRevisionSchedule = async (roadmapId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/revision/bulk-add-from-roadmap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ roadmapId })
            });

            if (!res.ok) throw new Error('Failed to add to revision schedule');

            const data = await res.json();
            toast({
                title: "Success!",
                description: `Added ${data.added} topics to revision schedule`
            });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    return (
        <DashboardLayout userRole="student" userName={profile?.name || 'Student'}>
            <div className="page-header animate-fade-in mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="page-title flex items-center gap-3">
                            <Calendar className="h-8 w-8 text-primary" />
                            My Study Roadmaps
                        </h1>
                        <p className="page-description mt-2">
                            Upload multiple syllabi and track progress for each.
                        </p>
                    </div>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".pdf,.txt"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={uploading}
                        />
                        <Button disabled={uploading} className="gap-2">
                            {uploading ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
                            {uploading ? 'Scanning...' : 'Upload Syllabus'}
                        </Button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : roadmaps.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                    <div className="bg-primary/20 p-4 rounded-full w-fit mx-auto mb-4">
                        <Calendar className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">No Roadmaps Found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        Upload your syllabus (PDF) to automatically generate a structured study roadmap!
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 animate-fade-in">
                    {roadmaps.map((roadmap) => (
                        <Card key={roadmap._id} className="bg-elevated border-white/10">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => toggleRoadmap(roadmap._id)}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    {expandedRoadmaps[roadmap._id] ? (
                                        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    ) : (
                                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{roadmap.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {roadmap.subjects.length} subjects • Created {new Date(roadmap.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <span className="font-bold text-primary">{roadmap.overallProgress}%</span>
                                    </div>
                                    <div className="w-24 h-2 bg-secondary/30 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-500"
                                            style={{ width: `${roadmap.overallProgress}%` }}
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToRevisionSchedule(roadmap._id);
                                        }}
                                        className="hover:bg-primary/20 hover:text-primary"
                                        title="Add to Revision Schedule"
                                    >
                                        <Brain className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteRoadmap(roadmap._id, roadmap.title);
                                        }}
                                        className="hover:bg-destructive/20 hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {expandedRoadmaps[roadmap._id] && (
                                <div className="border-t border-white/10 bg-black/20 p-4">
                                    <div className="grid gap-3">
                                        {roadmap.subjects.map((subject) => (
                                            <Card key={subject._id} className="bg-white/5 border-white/10">
                                                <div
                                                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5"
                                                    onClick={() => toggleSubject(subject._id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {expandedSubjects[subject._id] ? (
                                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                        <div>
                                                            <h4 className="font-medium">{subject.name}</h4>
                                                            <p className="text-xs text-muted-foreground">
                                                                {subject.topics.filter(t => t.isCompleted).length} / {subject.topics.length} completed
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-primary">{subject.progress}%</span>
                                                        <div className="w-16 h-1.5 bg-secondary/30 rounded-full">
                                                            <div
                                                                className="h-full bg-primary rounded-full"
                                                                style={{ width: `${subject.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {expandedSubjects[subject._id] && (
                                                    <div className="border-t border-white/10 p-2">
                                                        {subject.topics.map((topic) => (
                                                            <div
                                                                key={topic._id}
                                                                className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer"
                                                                onClick={() => toggleTopic(roadmap._id, subject._id, topic._id, topic.isCompleted)}
                                                            >
                                                                {topic.isCompleted ? (
                                                                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                                ) : (
                                                                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                                )}
                                                                <span className={topic.isCompleted ? 'text-sm text-muted-foreground line-through' : 'text-sm'}>
                                                                    {topic.name}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
