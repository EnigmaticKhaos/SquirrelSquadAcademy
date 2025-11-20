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
  
  const { data: bundle, isLoading, error } = useQuery({
    queryKey: ['bundles', id],
    queryFn: () => courseBundlesApi.getBundle(id).then(res => res.data.data),
    enabled: !!id,
  });

  const handlePurchase = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    // Purchase logic
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <ErrorMessage message="Bundle not found" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
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
                  <h1 className="mb-4 text-3xl font-bold">{bundle.name}</h1>
                  <p className="mb-6 text-lg text-gray-600">{bundle.description}</p>

                  <div className="mb-6">
                    <h2 className="mb-4 text-xl font-semibold">Courses in this bundle</h2>
                    <div className="space-y-2">
                      {bundle.courses.map((courseId, index) => (
                        <div key={courseId} className="flex items-center gap-3 rounded-lg border p-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-800">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <Link href={`/courses/${courseId}`} className="font-medium hover:text-blue-600">
                              Course {index + 1}
                            </Link>
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
                  <div className="mb-6 space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-gray-900">
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
                      <p className="text-sm text-gray-600">Includes</p>
                      <p className="text-lg font-semibold">{bundle.courses.length} courses</p>
                    </div>
                  </div>

                  <Button
                    onClick={handlePurchase}
                    className="w-full"
                    size="lg"
                  >
                    Purchase Bundle
                  </Button>

                  <div className="mt-6 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>✓</span>
                      <span>Lifetime access to all courses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>✓</span>
                      <span>Certificates for each course</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>✓</span>
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

