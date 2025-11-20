'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, LoadingSpinner, ErrorMessage, EmptyState, Button } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useCertificates } from '@/hooks/useCertificates';

export default function CertificatesPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useCertificates({ limit: 50, offset: 0 });

  const certificates = data?.certificates || [];

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <p className="mb-4 text-center text-gray-300">Please log in to view your certificates</p>
              <Link href="/login">
                <Button className="w-full">Go to Login</Button>
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
            title="My Certificates"
            description="View and download your course completion certificates"
          />

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <Card>
              <CardContent className="p-6">
                <ErrorMessage message="Failed to load certificates. Please try again later." />
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && certificates.length === 0 && (
            <EmptyState
              title="No certificates yet"
              description="Complete courses to earn certificates"
              icon={
                <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              }
            />
          )}

          {!isLoading && !error && certificates.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {certificates.map((certificate) => (
                <Card key={certificate._id} hover={true}>
                  <CardHeader>
                    <CardTitle className="text-gray-100">{certificate.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {certificate.certificateData?.courseName && (
                      <p className="mb-2 text-sm text-gray-400">
                        {certificate.certificateData.courseName}
                      </p>
                    )}
                    <p className="mb-4 text-sm text-gray-400">
                      Issued: {new Date(certificate.issuedDate).toLocaleDateString()}
                    </p>
                    <Link href={'/certificates/' + certificate.certificateId}>
                      <Button className="w-full">View Certificate</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

