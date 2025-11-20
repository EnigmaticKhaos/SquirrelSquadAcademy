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
      // Handle blob response
      const blob = response.data instanceof Blob 
        ? response.data 
        : new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${certificate.title || 'certificate'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to download certificate:', error);
      alert(error.response?.data?.message || 'Failed to download certificate. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!certificate) return;
    const shareUrl = certificate.shareableLink || `${window.location.origin}/certificates/verify/${certificate.certificateId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: certificate.title,
          text: `Check out my certificate: ${certificate.title}`,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error occurred, fallback to copying
        if ((error as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(shareUrl);
          alert('Link copied to clipboard!');
        }
      }
    } else {
      // Fallback to copying link
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy link:', error);
        alert('Please copy this link manually: ' + shareUrl);
      }
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
                  <Button variant="primary" onClick={handleDownload}>
                    Download PDF
                  </Button>
                  <Button variant="outline" onClick={handleShare}>
                    Share Certificate
                  </Button>
                </div>
                
                {certificate.verificationCode && (
                  <div className="mt-8 pt-8 border-t border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-100 mb-4">Verification</h3>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-2">Verification Code:</p>
                      <p className="text-lg font-mono text-gray-100 mb-4">{certificate.verificationCode}</p>
                      <p className="text-xs text-gray-400">
                        Use this code to verify the authenticity of this certificate at{' '}
                        <a 
                          href={`${window.location.origin}/certificates/verify/${certificate.certificateId}`}
                          className="text-blue-400 hover:text-blue-300"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {window.location.origin}/certificates/verify/{certificate.certificateId}
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

