'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CodeEditor, Select, Button, LoadingSpinner, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout';

export default function PlaygroundPage() {
  const { user } = useAuth();
  const [code, setCode] = useState('// Write your code here\nconsole.log("Hello, World!");');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
  ];

  const handleRun = async () => {
    setIsRunning(true);
    // In a real app, this would send code to a code execution service
    setTimeout(() => {
      setOutput('Code execution would happen here...');
      setIsRunning(false);
    }, 1000);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <p className="mb-4 text-center text-gray-600">Please log in to use the code playground</p>
              <Link href="/login">
                <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Go to Login
                </button>
              </Link>
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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Code Playground"
            description="Write, run, and test code in multiple programming languages"
          />

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Code Editor</CardTitle>
                  <div className="flex items-center gap-3">
                    <Select
                      options={languages}
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-40"
                    />
                    <Button
                      onClick={handleRun}
                      isLoading={isRunning}
                      disabled={isRunning}
                    >
                      Run
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  language={language}
                  placeholder="Write your code here..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Output</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-[400px] rounded-md bg-gray-900 p-4 font-mono text-sm text-green-400">
                  {isRunning ? (
                    <LoadingSpinner size="sm" />
                  ) : output ? (
                    <pre className="whitespace-pre-wrap">{output}</pre>
                  ) : (
                    <p className="text-gray-500">Output will appear here...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

