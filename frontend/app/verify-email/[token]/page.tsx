'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        
        if (response.data.success) {
          setStatus('success');
          setMessage('Email verified successfully! You can now log in.');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(
          err.response?.data?.message || 
          'Failed to verify email. The link may be invalid or expired.'
        );
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <svg
                  className="h-6 w-6 animate-spin text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                Verifying your email...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                Email Verified!
              </h2>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <p className="mt-4 text-sm text-gray-500">
                Redirecting to login page...
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="text-base font-medium text-blue-600 hover:text-blue-500"
                >
                  Go to login page →
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                Verification Failed
              </h2>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <div className="mt-6 space-y-4">
                <div>
                  <Link
                    href="/login"
                    className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Go to login page
                  </Link>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Need a new verification link?{' '}
                    <Link
                      href="/resend-verification"
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Resend verification email
                    </Link>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

