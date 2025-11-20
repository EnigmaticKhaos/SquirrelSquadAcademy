'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CodeEditor,
  Select,
  Button,
  LoadingSpinner,
  EmptyState,
  Textarea,
  Input,
  Badge,
} from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { codePlaygroundApi } from '@/lib/api';
import type { CodeExecutionResult, CodeLanguage, CodeSnippet } from '@/types';

const languages: Array<{ value: CodeLanguage; label: string }> = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
];

const statusVariant: Record<CodeExecutionResult['status'], 'success' | 'danger' | 'warning'> = {
  success: 'success',
  error: 'danger',
  timeout: 'warning',
  runtime_error: 'danger',
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const maybeResponse = (error as { response?: { data?: { message?: string } } }).response;
    return maybeResponse?.data?.message || fallback;
  }
  return fallback;
};

export default function PlaygroundPage() {
  const { user } = useAuth();
  const [code, setCode] = useState('// Write your code here\nconsole.log("Hello, World!");');
  const [language, setLanguage] = useState<CodeLanguage>('javascript');
  const [stdin, setStdin] = useState('');
  const [title, setTitle] = useState('');
  const [result, setResult] = useState<CodeExecutionResult | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: snippetData, isLoading: snippetsLoading, refetch: refetchSnippets } = useQuery({
    queryKey: ['playground', 'snippets'],
    queryFn: async () => {
      const response = await codePlaygroundApi.getMySnippets({ limit: 10 });
      const payload = response.data;
      if (Array.isArray(payload?.data)) {
        return payload.data as CodeSnippet[];
      }
      return payload ?? [];
    },
    enabled: !!user,
  });

  const snippets = useMemo(() => snippetData ?? [], [snippetData]);

  const executeMutation = useMutation({
    mutationFn: (payload: { code: string; language: CodeLanguage; stdin?: string }) =>
      codePlaygroundApi.executeCode(payload),
    onSuccess: (response) => {
      setResult(response.data?.data || response.data);
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Failed to execute code.') });
      setResult(null);
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      codePlaygroundApi.saveSnippet({
        code,
        language,
        title: title || 'Untitled Snippet',
        description: 'Saved from playground',
      }),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Snippet saved successfully.' });
      setTitle('');
      refetchSnippets();
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Failed to save snippet.') });
    },
  });

  const executeSnippetMutation = useMutation({
    mutationFn: (snippetId: string) => codePlaygroundApi.executeSnippet(snippetId, { stdin }),
    onSuccess: (response) => {
      const updatedSnippet = response.data?.data;
      if (updatedSnippet?.code) {
        setCode(updatedSnippet.code);
        setLanguage(updatedSnippet.language);
      }
      if (updatedSnippet?.executionResult) {
        setResult(updatedSnippet.executionResult);
      }
      refetchSnippets();
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Failed to execute snippet.') });
    },
  });

  const deleteSnippetMutation = useMutation({
    mutationFn: (snippetId: string) => codePlaygroundApi.deleteSnippet(snippetId),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Snippet deleted.' });
      refetchSnippets();
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Failed to delete snippet.') });
    },
  });

  const handleRun = () => {
    setFeedback(null);
    executeMutation.mutate({ code, language, stdin: stdin || undefined });
  };

  const handleSave = () => {
    setFeedback(null);
    saveMutation.mutate();
  };

  const handleLoadSnippet = (snippet: CodeSnippet) => {
    setCode(snippet.code);
    setLanguage(snippet.language);
    setTitle(snippet.title || '');
    setFeedback({ type: 'success', message: `Loaded "${snippet.title || 'Untitled Snippet'}".` });
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
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Code Playground"
            description="Write, run, and save snippets across multiple programming languages."
          />

          {feedback && (
            <div
              className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                feedback.type === 'success'
                  ? 'border-green-500/40 bg-green-500/10 text-green-100'
                  : 'border-red-500/40 bg-red-500/10 text-red-100'
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="bg-gray-800 text-gray-100">
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <CardTitle>Code Editor</CardTitle>
                  <div className="flex flex-wrap items-center gap-3">
                    <Select
                      options={languages}
                      value={language}
                      onChange={(event) => setLanguage(event.target.value as CodeLanguage)}
                      className="w-44 text-gray-900"
                    />
                    <Button onClick={handleRun} isLoading={executeMutation.isPending} disabled={executeMutation.isPending}>
                      Run
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  language={language}
                  placeholder="Write your code here..."
                  className="bg-gray-900"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Standard Input (stdin)</label>
                    <Textarea
                      value={stdin}
                      onChange={(event) => setStdin(event.target.value)}
                      placeholder="Optional input passed to your program"
                      className="border-gray-700 bg-gray-900 text-gray-100 placeholder:text-gray-500"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Snippet Title</label>
                    <Input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="e.g., Binary Search Example"
                      className="border-gray-700 bg-gray-900 text-gray-100 placeholder:text-gray-500"
                    />
                    <Button
                      className="mt-3 w-full"
                      variant="secondary"
                      onClick={handleSave}
                      isLoading={saveMutation.isPending}
                    >
                      Save Snippet
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-gray-800 text-gray-100">
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Output</CardTitle>
                  {result && (
                    <Badge variant={statusVariant[result.status]} className="capitalize">
                      {result.status.replace('_', ' ')}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="min-h-[250px] rounded-md border border-gray-700 bg-black p-4 font-mono text-sm">
                    {executeMutation.isPending ? (
                      <div className="flex items-center justify-center text-gray-400">
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : result ? (
                      <>
                        {result.output && (
                          <pre className="whitespace-pre-wrap text-green-400">{result.output}</pre>
                        )}
                        {result.error && (
                          <pre className="mt-3 whitespace-pre-wrap text-red-400">{result.error}</pre>
                        )}
                        {!result.output && !result.error && (
                          <p className="text-gray-400">No output returned for this execution.</p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500">Output will appear here...</p>
                    )}
                  </div>
                  {result && (
                    <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                      {result.executionTime !== undefined && (
                        <span>Time: {result.executionTime.toFixed(0)} ms</span>
                      )}
                      {result.memoryUsed !== undefined && <span>Memory: {result.memoryUsed} bytes</span>}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800 text-gray-100">
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Recent Snippets</CardTitle>
                  <span className="text-xs text-gray-400">Auto-saves are coming soon</span>
                </CardHeader>
                <CardContent>
                  {snippetsLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : snippets.length === 0 ? (
                    <EmptyState
                      title="No snippets yet"
                      description="Save a snippet to revisit and execute it later."
                      className="py-6 text-gray-400"
                    />
                  ) : (
                    <div className="space-y-3">
                      {snippets.map((snippet) => (
                        <div
                          key={snippet._id}
                          className="rounded-xl border border-gray-700 bg-gray-900/50 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-100">
                                {snippet.title || 'Untitled Snippet'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {snippet.lastExecuted
                                  ? `Last executed ${new Date(snippet.lastExecuted).toLocaleString()}`
                                  : `Saved ${new Date(snippet.createdAt).toLocaleString()}`}
                              </p>
                            </div>
                            <Badge variant="secondary" className="capitalize">
                              {snippet.language}
                            </Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleLoadSnippet(snippet)}>
                              Load
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => executeSnippetMutation.mutate(snippet._id)}
                              isLoading={executeSnippetMutation.isPending}
                            >
                              Run
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteSnippetMutation.mutate(snippet._id)}
                              isLoading={deleteSnippetMutation.isPending}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

