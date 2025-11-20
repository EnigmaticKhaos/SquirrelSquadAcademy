'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useGenerateLearningPath } from '@/hooks/useLearningPaths';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Textarea, Select, Card, CardContent, CardHeader, CardTitle, LoadingSpinner } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function GenerateLearningPathPage() {
  const router = useRouter();
  const { user } = useAuth();
  const generateMutation = useGenerateLearningPath();
  const [goal, setGoal] = useState('');
  const [learningStyle, setLearningStyle] = useState('');
  const [timeCommitment, setTimeCommitment] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const response = await generateMutation.mutateAsync({
        goal,
        learningStyle: learningStyle || undefined,
        timeCommitment: timeCommitment || undefined,
      });
      
      if (response.data.data) {
        router.push(`/learning-paths/${response.data.data._id}`);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to generate learning path');
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <p className="mb-4 text-center text-gray-600">Please log in to generate a learning path</p>
              <Button onClick={() => router.push('/login')} className="w-full">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Learning Paths', href: '/learning-paths' },
              { label: 'Generate AI Path' },
            ]}
          />

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Generate AI-Powered Learning Path</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-6">
                <Textarea
                  label="What do you want to learn?"
                  placeholder="e.g., I want to become a full-stack web developer..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  required
                  rows={4}
                />

                <Select
                  label="Learning Style (Optional)"
                  options={[
                    { value: '', label: 'Select learning style...' },
                    { value: 'visual', label: 'Visual' },
                    { value: 'hands-on', label: 'Hands-on' },
                    { value: 'theoretical', label: 'Theoretical' },
                    { value: 'mixed', label: 'Mixed' },
                  ]}
                  value={learningStyle}
                  onChange={(e) => setLearningStyle(e.target.value)}
                />

                <Select
                  label="Time Commitment (Optional)"
                  options={[
                    { value: '', label: 'Select time commitment...' },
                    { value: '1-2', label: '1-2 hours per week' },
                    { value: '3-5', label: '3-5 hours per week' },
                    { value: '6-10', label: '6-10 hours per week' },
                    { value: '10+', label: '10+ hours per week' },
                  ]}
                  value={timeCommitment}
                  onChange={(e) => setTimeCommitment(e.target.value)}
                />

                <Button
                  type="submit"
                  isLoading={generateMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  Generate Learning Path
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

