'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner, ErrorMessage } from '@/components/ui';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Authentication failed. Please try again.');
      setLoading(false);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      return;
    }

    if (token) {
      // Store token and redirect to dashboard
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        // Invalidate and refetch user data
        router.push('/dashboard');
      }
    } else {
      setError('No authentication token received.');
      setLoading(false);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <ErrorMessage message={error} />
          <p className="mt-4 text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

