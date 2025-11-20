'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { courseBundlesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, Badge, LoadingSpinner, ErrorMessage, Button, Modal } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';
import type { Course, CourseBundle } from '@/types';

const extractErrorMessage = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message;
  }
  return undefined;
};

export default function BundleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['bundle', id],
    queryFn: async () => {
      const response = await courseBundlesApi.getBundle(id);
      const payload = response.data;
      if (payload?.data) {
        return payload.data as { bundle: CourseBundle; ownsBundle?: boolean };
      }
      const bundleData = payload?.bundle ?? payload?.data;
      return {
        bundle: bundleData,
        ownsBundle: payload?.ownsBundle ?? payload?.data?.ownsBundle ?? false,
      };
    },
    enabled: !!id,
  });

  const bundle = data?.bundle;
  const ownsBundleFromServer = data?.ownsBundle ?? false;
  const [ownsBundle, setOwnsBundle] = useState(ownsBundleFromServer);
  const [purchaseNotice, setPurchaseNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);

  useEffect(() => {
    setOwnsBundle(ownsBundleFromServer);
  }, [ownsBundleFromServer]);

  const purchaseMutation = useMutation({
    mutationFn: () => courseBundlesApi.purchaseBundle(id, { paymentStatus: 'completed' }),
    onSuccess: (response) => {
      setOwnsBundle(true);
      setPurchaseModalOpen(false);
      const message =
        response.data?.message ||
        'Purchase completed! You now have access to all courses in this bundle.';
      setPurchaseNotice({ type: 'success', message });
      queryClient.invalidateQueries({ queryKey: ['bundle', id] });
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
    },
    onError: (error) => {
      const message = extractErrorMessage(error) || 'Failed to purchase bundle. Please try again.';
      setPurchaseNotice({ type: 'error', message });
    },
  });

  const handlePurchaseClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setPurchaseNotice(null);
    setPurchaseModalOpen(true);
  };

  const courses = useMemo(() => {
    if (!bundle) return [];
    const rawCourses = (bundle.courses as Array<string | Course>) ?? [];
    return rawCourses.map((course, index) => {
      if (typeof course === 'string') {
        return {
          _id: course,
          title: `Course ${index + 1}`,
          difficulty: undefined,
          thumbnail: undefined,
        };
      }
      return course as Course;
    });
  }, [bundle]);

  const formatCurrency = (value?: number, currency = 'USD') => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <ErrorMessage message="Bundle not found" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Bundles', href: '/bundles' },
              { label: bundle.name },
            ]}
          />

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-gray-800 text-gray-100">
                {bundle.thumbnail && (
                  <img
                    src={bundle.thumbnail}
                    alt={bundle.name}
                    className="h-64 w-full rounded-t-lg object-cover"
                  />
                )}
                <CardContent className="space-y-6 p-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-3xl font-bold">{bundle.name}</h1>
                      {bundle.category && (
                        <Badge variant="secondary" className="capitalize">
                          {bundle.category}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-3 text-gray-300">{bundle.description}</p>
                  </div>

                  <div>
                    <h2 className="mb-4 text-xl font-semibold">Courses in this bundle</h2>
                    <div className="space-y-3">
                      {courses.map((course, index) => (
                        <div
                          key={course._id}
                          className="flex items-center gap-4 rounded-xl border border-gray-700 bg-gray-900 p-4"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/20 text-sm font-semibold text-blue-200">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <Link href={`/courses/${course._id}`} className="font-semibold text-gray-100 hover:text-blue-300">
                              {course.title}
                            </Link>
                            <p className="text-xs text-gray-400">
                              {course.difficulty ? course.difficulty : 'Difficulty varies'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="bg-gray-800 text-gray-100">
                <CardContent className="space-y-6 p-6">
                  <div>
                    <p className="text-sm text-gray-400">Bundle price</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold">
                        {formatCurrency(bundle.price, bundle.currency)}
                      </span>
                      {bundle.originalPrice && bundle.originalPrice > bundle.price && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg text-gray-500 line-through">
                            {formatCurrency(bundle.originalPrice, bundle.currency)}
                          </span>
                          {bundle.discountPercentage && (
                            <Badge variant="success" size="lg">
                              Save {bundle.discountPercentage}%
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                    <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
                      <p className="text-sm font-semibold text-gray-300">What’s included</p>
                    <ul className="mt-3 space-y-2 text-sm text-gray-400">
                      <li>• {courses.length} guided courses</li>
                      <li>• Certificates for each completed course</li>
                      <li>• Lifetime access and future updates</li>
                      <li>• 30-day satisfaction guarantee</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    {purchaseNotice && (
                      <div
                        className={`rounded-lg border px-3 py-2 text-sm ${
                          purchaseNotice.type === 'success'
                            ? 'border-green-500/40 bg-green-500/10 text-green-200'
                            : 'border-red-500/40 bg-red-500/10 text-red-200'
                        }`}
                      >
                        {purchaseNotice.message}
                      </div>
                    )}
                    <Button
                      onClick={ownsBundle ? undefined : handlePurchaseClick}
                      className="w-full"
                      size="lg"
                      disabled={ownsBundle}
                    >
                      {ownsBundle ? 'Bundle Owned' : 'Purchase Bundle'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        title="Confirm bundle purchase"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPurchaseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => purchaseMutation.mutate()}
              isLoading={purchaseMutation.isPending}
            >
              Confirm purchase
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-gray-700">
          <p>
            You are about to purchase <span className="font-semibold">{bundle.name}</span> for{' '}
            <span className="font-semibold">{formatCurrency(bundle.price, bundle.currency)}</span>.
          </p>
            {bundle.originalPrice && bundle.originalPrice > bundle.price && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                You’re saving {formatCurrency(bundle.originalPrice - bundle.price, bundle.currency)} (
                {bundle.discountPercentage}% off the individual course prices).
              </div>
            )}
          <div>
            <p className="font-semibold">This purchase includes:</p>
            <ul className="mt-2 list-disc pl-5 text-sm">
              <li>Immediate enrollment into all courses</li>
              <li>Progress tracking and certificates for every course</li>
              <li>Access on web and mobile devices</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}

