'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useQuery } from '@tanstack/react-query';
import { courseBundlesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, Badge, LoadingSpinner, ErrorMessage, Button } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';
import type { CourseBundle } from '@/types';

export default function BundleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { user } = useAuth();
  
  const { data: bundleData, isLoading, error } = useQuery({
    queryKey: ['bundles', id],
    queryFn: async () => {
      const response = await courseBundlesApi.getBundle(id);
      return response.data;
    },
    enabled: !!id,
  });

  const bundle = bundleData?.bundle;
  const ownsBundle = bundleData?.ownsBundle || false;

  const handlePurchase = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (ownsBundle) {
      router.push('/dashboard');
      return;
    }

    try {
      // TODO: Implement purchase flow with Stripe
      // For now, show a message
      alert('Purchase functionality will be implemented with Stripe integration. Please check back soon!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to initiate purchase');
    }
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
        <main className="flex-1 flex items-center justify-center">
          <ErrorMessage message="Bundle not found" />
        </main>
      </div>
    );
  }

  // Handle both populated Course objects and course IDs
  const courses = bundle.courses || [];
  const courseList = courses.map((course: any, index: number) => {
    if (typeof course === 'string') {
      return { _id: course, title: `Course ${index + 1}`, thumbnail: null };
    }
    return course;
  });

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
            <div className="lg:col-span-2">
              <Card>
                {bundle.thumbnail && (
                  <img
                    src={bundle.thumbnail}
                    alt={bundle.name}
                    className="h-64 w-full rounded-t-lg object-cover"
                  />
                )}
                <CardContent className="p-6">
                  <h1 className="mb-4 text-3xl font-bold text-gray-100">{bundle.name}</h1>
                  <p className="mb-6 text-lg text-gray-400">{bundle.description}</p>

                  <div className="mb-6">
                    <h2 className="mb-4 text-xl font-semibold text-gray-100">Courses in this bundle</h2>
                    <div className="space-y-2">
                      {courseList.map((course: any, index: number) => (
                        <div key={course._id || index} className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 p-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <Link href={`/courses/${course._id}`} className="font-medium text-gray-100 hover:text-blue-400">
                              {course.title || `Course ${index + 1}`}
                            </Link>
                            {course.difficulty && (
                              <Badge variant="secondary" className="ml-2 capitalize">
                                {course.difficulty}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  {ownsBundle && (
                    <div className="mb-4 rounded-lg bg-green-900/20 border border-green-700 p-3">
                      <p className="text-sm font-medium text-green-300">✓ You own this bundle</p>
                    </div>
                  )}

                  <div className="mb-6 space-y-4">
                    <div>
                      <p className="text-sm text-gray-400">Price</p>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-gray-100">
                          ${bundle.price}
                        </span>
                        {bundle.originalPrice && bundle.originalPrice > bundle.price && (
                          <>
                            <span className="text-xl text-gray-500 line-through">
                              ${bundle.originalPrice}
                            </span>
                            {bundle.discountPercentage && (
                              <Badge variant="success" size="lg">
                                Save {bundle.discountPercentage}%
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Includes</p>
                      <p className="text-lg font-semibold text-gray-100">{courseList.length} courses</p>
                    </div>
                  </div>

                  {!ownsBundle ? (
                    <Button
                      onClick={handlePurchase}
                      variant="primary"
                      className="w-full"
                      size="lg"
                    >
                      Purchase Bundle
                    </Button>
                  ) : (
                    <Link href="/dashboard">
                      <Button
                        variant="primary"
                        className="w-full"
                        size="lg"
                      >
                        Go to Dashboard
                      </Button>
                    </Link>
                  )}

                  <div className="mt-6 space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Lifetime access to all courses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Certificates for each course</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>30-day money-back guarantee</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

