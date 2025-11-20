'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, Button, ProgressBar, LoadingSpinner, Badge } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';
import {
  useActivePomodoro,
  useStartPomodoro,
  usePausePomodoro,
  useResumePomodoro,
  useCompletePomodoro,
  useEndPomodoro,
  usePomodoroStatistics,
} from '@/hooks/usePomodoro';
import { useAuth } from '@/hooks/useAuth';
import type { PomodoroSession } from '@/lib/api/pomodoro';

export default function PomodoroPage() {
  const { user } = useAuth();
  const { data: activeSession, isLoading: sessionLoading } = useActivePomodoro();
  const startMutation = useStartPomodoro();
  const pauseMutation = usePausePomodoro();
  const resumeMutation = useResumePomodoro();
  const completeMutation = useCompletePomodoro();
  const endMutation = useEndPomodoro();
  const { data: statistics } = usePomodoroStatistics();

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate remaining time from session
  useEffect(() => {
    if (!activeSession) {
      setRemainingSeconds(0);
      return;
    }

    const calculateRemaining = () => {
      if (activeSession.isPaused && activeSession.pausedAt) {
        // If paused, use the duration at pause time
        const pausedDuration = Math.floor(
          (new Date(activeSession.pausedAt).getTime() - new Date(activeSession.startTime).getTime()) / 1000
        );
        const totalDuration = activeSession.sessionType === 'work' 
          ? activeSession.workDuration * 60
          : activeSession.sessionType === 'long_break'
          ? activeSession.longBreakDuration * 60
          : activeSession.shortBreakDuration * 60;
        return Math.max(0, totalDuration - pausedDuration);
      }

      // Calculate remaining time
      const now = new Date().getTime();
      const start = new Date(activeSession.startTime).getTime();
      const elapsed = Math.floor((now - start) / 1000) - activeSession.totalPausedTime;
      
      const totalDuration = activeSession.sessionType === 'work' 
        ? activeSession.workDuration * 60
        : activeSession.sessionType === 'long_break'
        ? activeSession.longBreakDuration * 60
        : activeSession.shortBreakDuration * 60;
      
      return Math.max(0, totalDuration - elapsed);
    };

    setRemainingSeconds(calculateRemaining());

    // Update timer every second if not paused
    if (!activeSession.isPaused) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          const newValue = Math.max(0, prev - 1);
          if (newValue === 0 && prev > 0) {
            // Timer completed
            if (activeSession) {
              completeMutation.mutate(activeSession._id);
            }
          }
          return newValue;
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
  }, [activeSession, completeMutation]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = (session: PomodoroSession | null) => {
    if (!session) return 25 * 60;
    if (session.sessionType === 'work') return session.workDuration * 60;
    if (session.sessionType === 'long_break') return session.longBreakDuration * 60;
    return session.shortBreakDuration * 60;
  };

  const handleStart = () => {
    startMutation.mutate({
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
    });
  };

  const handlePause = () => {
    if (activeSession) {
      pauseMutation.mutate(activeSession._id);
    }
  };

  const handleResume = () => {
    if (activeSession) {
      resumeMutation.mutate(activeSession._id);
    }
  };

  const handleComplete = () => {
    if (activeSession) {
      completeMutation.mutate(activeSession._id);
    }
  };

  const handleEnd = () => {
    if (activeSession) {
      endMutation.mutate(activeSession._id);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const totalDuration = getTotalDuration(activeSession);
  const progress = totalDuration > 0 ? ((totalDuration - remainingSeconds) / totalDuration) * 100 : 0;
  const sessionType = activeSession?.sessionType || 'work';
  const isBreak = sessionType === 'short_break' || sessionType === 'long_break';

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Study Tools', href: '/study-tools' },
              { label: 'Pomodoro Timer' },
            ]}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl text-gray-100">
                      {isBreak 
                        ? sessionType === 'long_break' 
                          ? 'Long Break' 
                          : 'Short Break'
                        : 'Focus Time'}
                    </CardTitle>
                    {activeSession && (
                      <Badge variant="info">
                        Pomodoro #{activeSession.currentPomodoro}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-12">
                  <div className="text-center">
                    <div className={`mb-8 text-7xl font-bold ${isBreak ? 'text-green-500' : 'text-blue-500'}`}>
                      {formatTime(remainingSeconds)}
                    </div>

                    <div className="mb-8">
                      <ProgressBar value={progress} showLabel={false} size="lg" />
                    </div>

                    {!activeSession ? (
                      <div className="flex justify-center gap-4">
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={handleStart}
                          isLoading={startMutation.isPending}
                        >
                          Start Pomodoro
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-4">
                        {activeSession.isPaused ? (
                          <Button
                            variant="primary"
                            size="lg"
                            onClick={handleResume}
                            isLoading={resumeMutation.isPending}
                          >
                            Resume
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="lg"
                            onClick={handlePause}
                            isLoading={pauseMutation.isPending}
                          >
                            Pause
                          </Button>
                        )}
                        {remainingSeconds === 0 ? (
                          <Button
                            variant="primary"
                            size="lg"
                            onClick={handleComplete}
                            isLoading={completeMutation.isPending}
                          >
                            Complete
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={handleEnd}
                            isLoading={endMutation.isPending}
                          >
                            End Session
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {statistics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-100">Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-400">Total Pomodoros:</span>
                      <p className="text-lg font-semibold text-gray-100">{statistics.totalPomodoros}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Total Work Time:</span>
                      <p className="text-lg font-semibold text-gray-100">
                        {formatDuration(statistics.totalWorkTime)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Current Streak:</span>
                      <p className="text-lg font-semibold text-gray-100">{statistics.currentStreak} days</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Best Streak:</span>
                      <p className="text-lg font-semibold text-gray-100">{statistics.bestStreak} days</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeSession && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-100">Session Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Completed:</span>
                      <span className="text-gray-100">{activeSession.completedPomodoros}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-gray-100 capitalize">{sessionType.replace('_', ' ')}</span>
                    </div>
                    {activeSession.activityType && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Activity:</span>
                        <span className="text-gray-100">{activeSession.activityType}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
