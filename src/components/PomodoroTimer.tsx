import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PomodoroTimerProps {
    onSessionComplete?: (duration: number) => void;
}

export function PomodoroTimer({ onSessionComplete }: PomodoroTimerProps) {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);

    const [workDuration] = useState(25);
    const [breakDuration] = useState(5);
    const [longBreakDuration] = useState(15);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleTimerComplete = useCallback(() => {
        setIsRunning(false);

        if (audioRef.current) {
            audioRef.current.play().catch(() => { });
        }

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(isBreak ? 'Break Complete!' : 'Pomodoro Complete!', {
                body: isBreak ? 'Time to get back to work!' : 'Take a break!',
                icon: '/icon.png'
            });
        }

        if (!isBreak) {
            const newCount = sessionsCompleted + 1;
            setSessionsCompleted(newCount);

            if (onSessionComplete) {
                onSessionComplete(workDuration);
            }

            const breakTime = newCount % 4 === 0 ? longBreakDuration : breakDuration;
            setTimeLeft(breakTime * 60);
            setIsBreak(true);
        } else {
            setTimeLeft(workDuration * 60);
            setIsBreak(false);
        }
    }, [isBreak, sessionsCompleted, onSessionComplete, workDuration, breakDuration, longBreakDuration]);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleTimerComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, timeLeft, handleTimerComplete]);

    const toggleTimer = () => {
        if (!isRunning && timeLeft === 0) {
            reset();
        }
        setIsRunning(!isRunning);

        if (!isRunning && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    };

    const reset = () => {
        setIsRunning(false);
        setTimeLeft(isBreak ? breakDuration * 60 : workDuration * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgress = () => {
        const total = isBreak
            ? (sessionsCompleted % 4 === 0 ? longBreakDuration : breakDuration) * 60
            : workDuration * 60;
        return ((total - timeLeft) / total) * 100;
    };

    return (
        <Card className={`bg-elevated border-white/10 ${isBreak ? 'border-green-500/30' : 'border-primary/30'}`}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>🍅 Pomodoro</span>
                    <span className="text-sm font-normal text-muted-foreground">
                        #{sessionsCompleted}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center">
                    <div className={`text-6xl font-bold mb-2 ${isBreak ? 'text-green-500' : 'text-primary'}`}>
                        {formatTime(timeLeft)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {isBreak ? (sessionsCompleted % 4 === 0 ? 'Long Break' : 'Break') : 'Focus'}
                    </p>
                </div>

                <Progress value={getProgress()} className="h-2" />

                <div className="flex gap-2 justify-center">
                    <Button
                        onClick={toggleTimer}
                        size="lg"
                        className={isBreak ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                        {isRunning ? (
                            <>
                                <Pause className="mr-2 h-5 w-5" />
                                Pause
                            </>
                        ) : (
                            <>
                                <Play className="mr-2 h-5 w-5" />
                                {timeLeft === 0 ? 'Start' : 'Resume'}
                            </>
                        )}
                    </Button>
                    <Button variant="outline" onClick={reset} size="lg">
                        <RotateCcw className="h-5 w-5" />
                    </Button>
                </div>

                <div className="text-xs text-muted-foreground text-center">
                    <div>
                        {workDuration}m work • {breakDuration}m break • {longBreakDuration}m long
                    </div>
                </div>
            </CardContent>

            <audio
                ref={audioRef}
                src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVDwtGn+DyvmwhBSuBzvLZiTYX"
                preload="auto"
            />
        </Card>
    );
}
