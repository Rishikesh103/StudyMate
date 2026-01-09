import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  FileText, Save, Upload, Brain, TrendingUp, Sparkles,
  Clock, BookOpen, Target, Zap, AlertCircle
} from "lucide-react";

type MoodType = 'great' | 'good' | 'neutral' | 'tired' | 'stressed';

const moodOptions = [
  { value: 'great' as MoodType, icon: '😄', label: 'Great', color: 'success' },
  { value: 'good' as MoodType, icon: '🙂', label: 'Good', color: 'primary' },
  { value: 'neutral' as MoodType, icon: '😐', label: 'Neutral', color: 'warning' },
  { value: 'tired' as MoodType, icon: '😴', label: 'Tired', color: 'info' },
  { value: 'stressed' as MoodType, icon: '😰', label: 'Stressed', color: 'danger' },
];

export default function StudyLogPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    subject: '', topic: '', subtopic: '', duration: 30, mood: 'good' as MoodType,
    difficulty: 3, notes: '',
  });
  const [cognitiveLoad, setCognitiveLoad] = useState(50);
  const [isSaving, setIsSaving] = useState(false);

  const calculateCognitiveLoad = () => {
    const base = (formData.difficulty / 5) * 60;
    const durationFactor = Math.min(formData.duration / 60, 1.5) * 20;
    return Math.min(Math.round(base + durationFactor), 100);
  };

  useEffect(() => {
    setCognitiveLoad(calculateCognitiveLoad());
  }, [formData.difficulty, formData.duration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;

    setIsSaving(true);
    const load = calculateCognitiveLoad();

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: formData.subject.trim(), topic: formData.topic.trim() || null,
          subtopic: formData.subtopic?.trim() || null,
          duration: formData.duration, mood: formData.mood,
          difficulty: formData.difficulty, cognitiveLoad: load,
          notes: formData.notes || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast({ title: "🎉 Session saved!", description: `${formData.duration} minutes of ${formData.subject} recorded.` });
      setFormData({ subject: '', topic: '', subtopic: '', duration: 30, mood: 'good', difficulty: 3, notes: '' });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save. Try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout userRole="student" userName={profile?.name || 'Student'}>
      <div className="page-header animate-fade-in">
        <h1 className="page-title flex items-center gap-3">
          <FileText className="h-10 w-10 text-primary" />
          Log Study Session
        </h1>
        <p className="page-description">Track your progress and improve your study habits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Session Details
              </h3>
            </div>
            <div className="card-content">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* MOOD SELECTION - Moved to top for prominence */}
                <div className="form-group">
                  <label className="label text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    How did you feel?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {moodOptions.map(m => (
                      <button key={m.value} type="button"
                        className={`mood-button ${formData.mood === m.value ? 'mood-button-active' : ''} mood-${m.color}`}
                        onClick={() => setFormData({ ...formData, mood: m.value })}>
                        <span className="text-5xl mb-2">{m.icon}</span>
                        <span className="text-sm font-semibold">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="label label-required">Subject</label>
                    <input className="input" placeholder="e.g. Mathematics" value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="label">Topic</label>
                    <input className="input" placeholder="e.g. Calculus" value={formData.topic}
                      onChange={e => setFormData({ ...formData, topic: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="label">Subtopic</label>
                    <input className="input" placeholder="e.g. Limits" value={formData.subtopic}
                      onChange={e => setFormData({ ...formData, subtopic: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="label label-required">Duration (minutes)</label>
                  <input type="range" min="5" max="180" step="5" value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full accent-primary" />
                  <div className="flex justify-between text-sm text-secondary mt-2">
                    <span>5 min</span>
                    <span className="font-bold text-primary text-lg">{formData.duration} min</span>
                    <span>3 hrs</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Difficulty (1-5)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <button key={lvl} type="button"
                        className={`btn flex-1 ${formData.difficulty === lvl ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setFormData({ ...formData, difficulty: lvl })}>
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Notes (optional)</label>
                  <textarea className="input" rows={3} placeholder="What did you learn today?"
                    value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                </div>

                <button type="submit" className={`btn btn-primary w-full ${isSaving ? 'btn-loading' : ''}`} disabled={isSaving}>
                  {!isSaving && <><Save className="h-5 w-5 mr-2" /> Save Session</>}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card card-glass animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary animate-pulse" />
                Cognitive Load
              </h3>
            </div>
            <div className="card-content">
              <div className="relative h-40 flex items-center justify-center">
                <svg className="transform -rotate-90" width="160" height="160">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="var(--border-main)" strokeWidth="12" />
                  <circle cx="80" cy="80" r="70" fill="none" stroke="url(#gradient)" strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - cognitiveLoad / 100)}`}
                    strokeLinecap="round" className="transition-all duration-500" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: 'var(--primary)' }} />
                      <stop offset="100%" style={{ stopColor: '#EC4899' }} />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-primary">{cognitiveLoad}%</div>
                  <div className="text-sm text-secondary">{cognitiveLoad < 50 ? 'Light' : cognitiveLoad < 75 ? 'Moderate' : 'Intense'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card animate-fade-in" style={{ animationDelay: '250ms' }}>
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Quick Tips
              </h3>
            </div>
            <div className="card-content">
              <div className="flex flex-col gap-3">
                {[
                  { icon: Clock, text: "Take breaks every 25 minutes (Pomodoro technique)" },
                  { icon: Target, text: "Set specific goals for each session" },
                  { icon: Zap, text: "Review notes within 24 hours for better retention" },
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-elevated/50">
                    <tip.icon className="h-5 w-5 text-primary mt-0.5" />
                    <p className="text-sm text-secondary">{tip.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
