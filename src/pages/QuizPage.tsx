import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Brain, Sparkles, Loader2, Trophy, CheckCircle, XCircle, ChevronDown } from "lucide-react";

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[];
  points: number;
}

interface QuizResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

interface RoadmapSubject {
  name: string;
  topics: { name: string; isCompleted: boolean }[];
}

interface Answer {
  questionId: string;
  userAnswer: string;
}

export default function QuizPage() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [quizState, setQuizState] = useState<'setup' | 'active' | 'results'>('setup');

  // Roadmap data
  const [roadmap, setRoadmap] = useState<RoadmapSubject[]>([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [availableTopics, setAvailableTopics] = useState<{ name: string; isCompleted: boolean }[]>([]);

  // Quiz settings
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);

  // Quiz data
  const [quizId, setQuizId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [startTime, setStartTime] = useState(0);

  // Results
  const [results, setResults] = useState<QuizResult[]>([]);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  useEffect(() => {
    fetchRoadmap();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      const subject = roadmap.find(s => s.name === selectedSubject);
      setAvailableTopics(subject?.topics || []);
      setSelectedTopic('');
    }
  }, [selectedSubject, roadmap]);

  const fetchRoadmap = async () => {
    try {
      setLoadingRoadmap(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users/roadmap/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch roadmaps');

      const roadmaps = await res.json();

      // Combine subjects from all roadmaps
      const allSubjects: RoadmapSubject[] = [];
      roadmaps.forEach((roadmap: any) => {
        if (roadmap.subjects && roadmap.subjects.length > 0) {
          roadmap.subjects.forEach((subject: any) => {
            // Check if subject already exists (avoid duplicates)
            const exists = allSubjects.find(s => s.name === subject.name);
            if (!exists) {
              allSubjects.push(subject);
            }
          });
        }
      });

      if (allSubjects.length > 0) {
        setRoadmap(allSubjects);
        setSelectedSubject(allSubjects[0].name);
      }
    } catch (error) {
      console.error('Roadmap fetch error:', error);
      toast({
        title: "No Roadmap Found",
        description: "Please upload your syllabus first to generate quizzes",
        variant: "destructive"
      });
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const generateQuiz = async () => {
    if (!selectedSubject || !selectedTopic) {
      toast({ title: "Error", description: "Please select a subject and topic", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/quizzes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: selectedTopic,
          subject: selectedSubject,
          difficulty,
          questionCount
        })
      });

      if (!res.ok) throw new Error('Failed to generate quiz');

      const data = await res.json();
      setQuizId(data.quizId);
      setQuestions(data.questions);
      // Initialize answers with questionId for each question
      setAnswers(data.questions.map((q: Question) => ({
        questionId: q.id,
        userAnswer: ''
      })));
      setStartTime(Date.now());
      setQuizState('active');

      toast({ title: "Quiz Ready!", description: `${data.questionCount} questions generated` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate quiz", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = {
      questionId: questions[currentQ].id,
      userAnswer: answer
    };
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    }
  };

  const submitQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      console.log('Submitting quiz:', { quizId, answers, timeSpent });

      const res = await fetch(`http://localhost:5000/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers, timeSpent })
      });

      const data = await res.json();
      console.log('Submit response:', data);

      if (!res.ok) throw new Error(data.message || 'Failed to submit quiz');

      setResults(data.results);
      setScore(data.score.percentage);
      setXpEarned(data.xpEarned);

      // Wrap state transition to avoid React Router/Strict Mode conflicts
      setTimeout(() => {
        setQuizState('results');
      }, 0);

      toast({ title: "Quiz Submitted!", description: `+${data.xpEarned} XP earned` });
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({ title: "Error", description: error.message || "Failed to submit quiz", variant: "destructive" });
    }
  };

  const resetQuiz = () => {
    setQuizState('setup');
    setCurrentQ(0);
    setAnswers([]);
    setResults([]);
  };

  return (
    <DashboardLayout userRole="student" userName={profile?.name || 'Student'}>
      <div className="page-header animate-fade-in">
        <h1 className="page-title flex items-center gap-3">
          <Brain className="h-10 w-10 text-primary" />
          AI Quiz Generator
        </h1>
        <p className="page-description">Test your knowledge on topics from your syllabus</p>
      </div>

      {quizState === 'setup' && (
        <div className="max-w-md mx-auto animate-fade-in-scale">
          <div className="card card-glass">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                Generate Quiz
              </h3>
            </div>
            <div className="card-content space-y-4">
              {loadingRoadmap ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                  <p className="text-sm text-secondary">Loading your syllabus...</p>
                </div>
              ) : roadmap.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="font-semibold mb-2">No Syllabus Found</p>
                  <p className="text-sm text-secondary mb-4">Upload your syllabus to generate quizzes</p>
                  <a href="/roadmap" className="btn btn-primary">Upload Syllabus</a>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="label label-required">Subject</label>
                    <div className="relative">
                      <select
                        className="input pr-10 appearance-none"
                        value={selectedSubject}
                        onChange={e => setSelectedSubject(e.target.value)}
                      >
                        {roadmap.map(subject => (
                          <option key={subject.name} value={subject.name}>{subject.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label label-required">Topic</label>
                    <div className="relative">
                      <select
                        className="input pr-10 appearance-none"
                        value={selectedTopic}
                        onChange={e => setSelectedTopic(e.target.value)}
                        disabled={!selectedSubject}
                      >
                        <option value="">Select a topic</option>
                        {availableTopics.map(topic => (
                          <option key={topic.name} value={topic.name}>
                            {topic.name} {topic.isCompleted ? '✓' : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label">Difficulty</label>
                    <div className="flex gap-2">
                      {(['easy', 'medium', 'hard'] as const).map(diff => (
                        <button
                          key={diff}
                          onClick={() => setDifficulty(diff)}
                          className={`btn flex-1 ${difficulty === diff ? 'btn-primary' : 'btn-outline'}`}
                        >
                          {diff.charAt(0).toUpperCase() + diff.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label">Questions</label>
                    <select className="input" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}>
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions</option>
                    </select>
                  </div>

                  <button
                    onClick={generateQuiz}
                    disabled={!selectedSubject || !selectedTopic || isGenerating}
                    className={`btn btn-primary w-full ${isGenerating ? 'btn-loading' : ''}`}
                  >
                    {isGenerating ? (
                      <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="h-5 w-5 mr-2" /> Generate Quiz</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {quizState === 'active' && (
        <div className="max-w-2xl mx-auto animate-fade-in space-y-4">
          <div className="flex justify-between items-center">
            <span className="badge badge-primary">Question {currentQ + 1}/{questions.length}</span>
            <span className="text-sm text-secondary">{selectedSubject} • {selectedTopic}</span>
          </div>

          <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            />
          </div>

          <div className="card">
            <div className="card-content py-8">
              <h3 className="text-2xl font-bold mb-6">{questions[currentQ]?.question}</h3>
              <div className="grid gap-3">
                {questions[currentQ]?.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt)}
                    className={`btn text-left justify-start p-4 hover-lift ${answers[currentQ]?.userAnswer === opt ? 'btn-primary' : 'btn-outline'}`}
                  >
                    <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 font-bold text-primary">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => currentQ > 0 && setCurrentQ(currentQ - 1)}
              disabled={currentQ === 0}
              className="btn btn-outline"
            >
              Previous
            </button>
            {currentQ === questions.length - 1 ? (
              <button onClick={submitQuiz} className="btn btn-primary">
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={() => setCurrentQ(currentQ + 1)}
                disabled={!answers[currentQ]?.userAnswer}
                className="btn btn-primary"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}

      {quizState === 'results' && (
        <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
          <div className="card card-gradient text-center">
            <div className="card-content py-12">
              <Trophy className="h-20 w-20 mx-auto mb-4 text-white animate-bounce" />
              <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
              <div className="text-6xl font-bold my-6">{score}%</div>
              <p className="text-lg opacity-90 mb-4">+{xpEarned} XP Earned</p>
              <button onClick={resetQuiz} className="btn bg-white text-primary hover:bg-gray-100">
                New Quiz
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Review Answers</h3>
            </div>
            <div className="card-content space-y-4">
              {results.map((result, idx) => (
                <div key={idx} className={`p-4 rounded-lg border-2 ${result.isCorrect ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <div className="flex items-start gap-3">
                    {result.isCorrect ? (
                      <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold mb-2">Question {idx + 1}</p>
                      <p className="text-sm text-muted-foreground mb-2">{questions[idx]?.question}</p>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Your answer:</span> {result.userAnswer}</p>
                        {!result.isCorrect && (
                          <p className="text-green-400"><span className="font-medium">Correct answer:</span> {result.correctAnswer}</p>
                        )}
                        {result.explanation && (
                          <p className="text-muted-foreground italic mt-2">{result.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
