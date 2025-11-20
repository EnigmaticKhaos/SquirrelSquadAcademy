'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, Button, ProgressBar } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function PomodoroPage() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev === 0) {
            if (minutes === 0) {
              // Timer finished
              setIsRunning(false);
              setIsBreak(!isBreak);
              setMinutes(isBreak ? 25 : 5);
              return 0;
            }
            setMinutes((prev) => prev - 1);
            return 59;
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
  }, [isRunning, minutes, isBreak]);

  const totalSeconds = (isBreak ? 5 : 25) * 60;
  const currentSeconds = minutes * 60 + seconds;
  const progress = ((totalSeconds - currentSeconds) / totalSeconds) * 100;

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setIsRunning(false);
    setMinutes(isBreak ? 5 : 25);
    setSeconds(0);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Study Tools', href: '/study-tools' },
              { label: 'Pomodoro Timer' },
            ]}
          />

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {isBreak ? 'Break Time' : 'Focus Time'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-12">
              <div className="text-center">
                <div className="mb-8 text-7xl font-bold text-blue-600">
                  {formatTime(minutes, seconds)}
                </div>

                <div className="mb-8">
                  <ProgressBar value={progress} showLabel={false} size="lg" />
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    variant={isRunning ? 'secondary' : 'primary'}
                    size="lg"
                    onClick={() => setIsRunning(!isRunning)}
                  >
                    {isRunning ? 'Pause' : 'Start'}
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

