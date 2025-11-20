'use client';

import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card, CardContent, LoadingSpinner, ErrorMessage, Button } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function CertificateDetailPage() {
  const params = useParams();
  const { id } = params as { id: string };

  // Mock certificate data - in real app, fetch from API
  const certificate = {
    _id: id,
    title: 'Course Completion Certificate',
    issuedDate: new Date().toISOString(),
    certificateId: 'CERT-12345',
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Certificates', href: '/certificates' },
              { label: certificate.title },
            ]}
          />

          <Card className="mt-8">
            <CardContent className="p-8">
              <div className="text-center">
                <h1 className="mb-4 text-3xl font-bold">{certificate.title}</h1>
                <p className="mb-6 text-gray-600">
                  Certificate ID: {certificate.certificateId}
                </p>
                <p className="mb-8 text-gray-600">
                  Issued: {new Date(certificate.issuedDate).toLocaleDateString()}
                </p>

                <div className="flex justify-center gap-4">
                  <Button variant="primary">Download PDF</Button>
                  <Button variant="outline">Share</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

