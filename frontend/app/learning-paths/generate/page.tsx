'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useGenerateLearningPath } from '@/hooks/useLearningPaths';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Textarea, Select, Card, CardContent, CardHeader, CardTitle, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function GenerateLearningPathPage() {
  const router = useRouter();
  const { user } = useAuth();
  const generateMutation = useGenerateLearningPath();
  const [targetSkill, setTargetSkill] = useState('');
  const [currentLevel, setCurrentLevel] = useState('');
  const [learningStyle, setLearningStyle] = useState('');
  const [timeCommitment, setTimeCommitment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (!targetSkill.trim()) {
      setError('Please enter what you want to learn');
      return;
    }

    try {
      const response = await generateMutation.mutateAsync({
        targetSkill: targetSkill.trim(),
        currentLevel: currentLevel || undefined,
        learningStyle: learningStyle || undefined,
        timeCommitment: timeCommitment || undefined,
      });
      
      // Backend returns { success: true, path: LearningPath }
      const path = response.data.path || response.data.data?.path || response.data.data;
      if (path?._id) {
        router.push(`/learning-paths/${path._id}`);
      } else {
        setError('Failed to generate learning path. Please try again.');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to generate learning path. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <p className="mb-4 text-center text-gray-300">Please log in to generate a learning path</p>
              <Button onClick={() => router.push('/login')} variant="primary" className="w-full">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Learning Paths', href: '/learning-paths' },
              { label: 'Generate AI Path' },
            ]}
          />

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-gray-100">Generate AI-Powered Learning Path</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-6">
                {error && (
                  <ErrorMessage message={error} />
                )}

                <div>
                  <label htmlFor="targetSkill" className="block text-sm font-medium text-gray-300 mb-2">
                    What do you want to learn? <span className="text-red-400">*</span>
                  </label>
                  <Textarea
                    id="targetSkill"
                    placeholder="e.g., I want to become a full-stack web developer..."
                    value={targetSkill}
                    onChange={(e) => setTargetSkill(e.target.value)}
                    required
                    rows={4}
                    className="bg-gray-800 text-gray-100 border-gray-700"
                  />
                </div>

                <div>
                  <label htmlFor="currentLevel" className="block text-sm font-medium text-gray-300 mb-2">
                    Current Level (Optional)
                  </label>
                  <Select
                    id="currentLevel"
                    options={[
                      { value: '', label: 'Select your current level...' },
                      { value: 'beginner', label: 'Beginner' },
                      { value: 'intermediate', label: 'Intermediate' },
                      { value: 'advanced', label: 'Advanced' },
                      { value: 'expert', label: 'Expert' },
                    ]}
                    value={currentLevel}
                    onChange={(e) => setCurrentLevel(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="learningStyle" className="block text-sm font-medium text-gray-300 mb-2">
                    Learning Style (Optional)
                  </label>
                  <Select
                    id="learningStyle"
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
                </div>

                <div>
                  <label htmlFor="timeCommitment" className="block text-sm font-medium text-gray-300 mb-2">
                    Time Commitment (Optional)
                  </label>
                  <Select
                    id="timeCommitment"
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
                </div>

                <Button
                  type="submit"
                  variant="primary"
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

