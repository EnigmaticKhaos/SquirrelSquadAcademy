'use client';

import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card, CardContent, LoadingSpinner, ErrorMessage, Button } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';
import { useCertificate } from '@/hooks/useCertificates';
import { certificatesApi } from '@/lib/api';

export default function CertificateDetailPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const { data: certificate, isLoading, error } = useCertificate(id);

  const handleDownload = async () => {
    if (!certificate) return;
    try {
      const response = await certificatesApi.downloadCertificate(certificate.certificateId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${certificate.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download certificate:', error);
    }
  };

  const handleShare = () => {
    if (!certificate) return;
    if (navigator.share) {
      navigator.share({
        title: certificate.title,
        text: `Check out my certificate: ${certificate.title}`,
        url: certificate.shareableLink,
      }).catch(() => {
        // Fallback to copying link
        navigator.clipboard.writeText(certificate.shareableLink);
      });
    } else {
      navigator.clipboard.writeText(certificate.shareableLink);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <Card>
              <CardContent className="p-6">
                <ErrorMessage message="Failed to load certificate. Please try again later." />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
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
                <h1 className="mb-4 text-3xl font-bold text-gray-100">{certificate.title}</h1>
                {certificate.description && (
                  <p className="mb-4 text-gray-400">{certificate.description}</p>
                )}
                {certificate.certificateData?.courseName && (
                  <p className="mb-4 text-lg text-gray-300">
                    {certificate.certificateData.courseName}
                  </p>
                )}
                <p className="mb-2 text-gray-400">
                  Certificate ID: {certificate.certificateId}
                </p>
                <p className="mb-2 text-gray-400">
                  Issued: {new Date(certificate.issuedDate).toLocaleDateString()}
                </p>
                {certificate.certificateData?.finalScore !== undefined && (
                  <p className="mb-2 text-gray-400">
                    Final Score: {certificate.certificateData.finalScore}%
                  </p>
                )}
                {certificate.certificateData?.duration && (
                  <p className="mb-8 text-gray-400">
                    Duration: {certificate.certificateData.duration}
                  </p>
                )}

                <div className="flex justify-center gap-4">
                  {certificate.pdfUrl && (
                    <Button variant="primary" onClick={handleDownload}>
                      Download PDF
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleShare}>
                    Share
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

