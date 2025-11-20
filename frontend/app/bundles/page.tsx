'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  LoadingSpinner,
  ErrorMessage,
  SearchBar,
  Pagination,
  Modal,
} from '@/components/ui';
import { Checkbox } from '@/components/ui/Checkbox';
import { PageHeader } from '@/components/layout';
import { courseBundlesApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { Course, CourseBundle } from '@/types';

export default function BundlesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['bundles', { page, search }],
    queryFn: async () => {
      const response = await courseBundlesApi.getBundles({
        page,
        limit: 12,
        search: search.trim() || undefined,
      });
      const payload = response.data;
      if (payload?.data) {
        return payload.data as { bundles: CourseBundle[]; total?: number; count?: number };
      }
      return {
        bundles: payload?.bundles ?? [],
        total: payload?.total ?? payload?.count ?? payload?.bundles?.length ?? 0,
        count: payload?.count ?? payload?.bundles?.length ?? 0,
      };
    },
  });

  const bundles = useMemo(() => data?.bundles ?? [], [data?.bundles]);
  const totalPages = !data?.total || data.total <= 0 ? 1 : Math.max(1, Math.ceil(data.total / 12));

  const selectedBundles = useMemo(
    () => bundles.filter((bundle: any) => compareIds.includes(bundle._id)),
    [bundles, compareIds]
  );

  const toggleCompare = (bundleId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(bundleId)) {
        return prev.filter((id) => id !== bundleId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, bundleId];
    });
  };

  const clearComparison = () => {
    setCompareIds([]);
    setIsCompareOpen(false);
  };

  const formatCurrency = (value?: number, currency = 'USD') => {
    if (value === undefined || value === null || Number.isNaN(value)) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Course Bundles"
            description="Save money by purchasing multiple courses together"
          />

          <div className="mb-6">
            <SearchBar
              placeholder="Search bundles..."
              value={search}
              onChange={setSearch}
              className="max-w-md"
            />
          </div>

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <ErrorMessage message="Failed to load bundles" onRetry={() => router.refresh()} />
          )}

          {bundles.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {bundles.map((bundle: CourseBundle) => {
                  const courseItems = (bundle.courses as Array<string | Course>) ?? [];
                  const courseCount = courseItems.length;
                  const isSelected = compareIds.includes(bundle._id);

                  return (
                    <Card key={bundle._id} hover className="h-full bg-gray-800">
                      <div className="relative">
                        {bundle.thumbnail && (
                          <img
                            src={bundle.thumbnail}
                            alt={bundle.name}
                            className="h-48 w-full rounded-t-lg object-cover"
                          />
                        )}
                        <div className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs text-gray-200">
                          {courseCount} course{courseCount === 1 ? '' : 's'}
                        </div>
                      </div>
                      <CardHeader className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <CardTitle className="text-gray-100 line-clamp-1">{bundle.name}</CardTitle>
                          <Checkbox
                            aria-label="Select for comparison"
                            checked={isSelected}
                            onChange={() => toggleCompare(bundle._id)}
                          />
                        </div>
                        {bundle.category && (
                          <Badge variant="secondary" size="sm" className="capitalize w-fit">
                            {bundle.category}
                          </Badge>
                        )}
                      </CardHeader>
                      <CardContent className="flex h-full flex-col justify-between space-y-4">
                        <p className="text-sm text-gray-400 line-clamp-3">{bundle.description}</p>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gray-100">
                              {formatCurrency(bundle.price, bundle.currency)}
                            </span>
                            {bundle.originalPrice && bundle.originalPrice > bundle.price && (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-lg text-gray-500 line-through">
                                  {formatCurrency(bundle.originalPrice, bundle.currency)}
                                </span>
                                {bundle.discountPercentage && (
                                  <Badge variant="success">{bundle.discountPercentage}% OFF</Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-400">
                              <span>{bundle.enrollmentCount || 0} enrolled</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/bundles/${bundle._id}`)}
                            >
                              View details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}

          {!isLoading && !error && bundles.length === 0 && (
            <div className="rounded-2xl border border-gray-800 bg-gray-800/50 p-8 text-center text-gray-400">
              No bundles match your search yet. Try adjusting your filters or check back soon.
            </div>
          )}
        </div>

        {selectedBundles.length > 0 && (
          <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-700 bg-gray-900/95 px-6 py-4 shadow-lg backdrop-blur">
              <div className="text-sm text-gray-300">
                {selectedBundles.length} bundle{selectedBundles.length === 1 ? '' : 's'} selected for comparison
                {selectedBundles.length >= 3 && <span className="ml-2 text-xs text-gray-400">(maximum reached)</span>}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="primary"
                  disabled={selectedBundles.length < 2}
                  onClick={() => setIsCompareOpen(true)}
                >
                  Compare Selected
                </Button>
                <Button variant="ghost" size="sm" onClick={clearComparison}>
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}

        <ComparisonModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          bundles={selectedBundles}
          formatCurrency={formatCurrency}
          onRemoveBundle={(id) => setCompareIds((prev) => prev.filter((bundleId) => bundleId !== id))}
        />
      </main>
    </div>
  );
}

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  bundles: CourseBundle[];
  formatCurrency: (value?: number, currency?: string) => string;
  onRemoveBundle: (id: string) => void;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose, bundles, formatCurrency, onRemoveBundle }) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compare bundles"
      size="xl"
    >
      {bundles.length === 0 ? (
        <p className="text-sm text-gray-500">Select bundles to compare.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700 text-sm text-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Feature
                </th>
                {bundles.map((bundle) => (
                  <th key={bundle._id} className="px-4 py-3 text-left font-semibold">
                    <div className="flex items-center justify-between gap-3">
                      <span>{bundle.name}</span>
                      <button
                        onClick={() => onRemoveBundle(bundle._id)}
                        className="text-xs text-gray-400 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <ComparisonRow label="Price">
                {bundles.map((bundle) => (
                  <span key={bundle._id} className="font-semibold text-white">
                    {formatCurrency(bundle.price, bundle.currency)}
                  </span>
                ))}
              </ComparisonRow>
              <ComparisonRow label="Original Price">
                {bundles.map((bundle) => (
                  <span key={bundle._id}>
                    {bundle.originalPrice ? formatCurrency(bundle.originalPrice, bundle.currency) : '—'}
                  </span>
                ))}
              </ComparisonRow>
              <ComparisonRow label="Savings">
                {bundles.map((bundle) => {
                  if (!bundle.originalPrice || !bundle.price || bundle.originalPrice <= bundle.price) {
                    return <span key={bundle._id}>—</span>;
                  }
                  return (
                    <span key={bundle._id} className="text-green-400">
                      {formatCurrency(bundle.originalPrice - bundle.price, bundle.currency)} ({bundle.discountPercentage}%)
                    </span>
                  );
                })}
              </ComparisonRow>
              <ComparisonRow label="Courses Included">
                {bundles.map((bundle) => {
                  const courses = (bundle.courses as Array<string | Course>) ?? [];
                  return <span key={bundle._id}>{courses.length}</span>;
                })}
              </ComparisonRow>
              <ComparisonRow label="Top Courses">
                {bundles.map((bundle) => {
                  const courses = (bundle.courses as Array<string | Course>) ?? [];
                  const topThree = courses.slice(0, 3).map((course, index) => {
                    if (typeof course === 'string') {
                      return `Course ${index + 1}`;
                    }
                    return course.title;
                  });
                  return (
                    <ul key={bundle._id} className="list-disc pl-4 text-xs text-gray-300">
                      {topThree.map((title, idx) => (
                        <li key={idx}>{title}</li>
                      ))}
                      {courses.length > 3 && <li>+{courses.length - 3} more</li>}
                    </ul>
                  );
                })}
              </ComparisonRow>
              <ComparisonRow label="Difficulty Mix">
                {bundles.map((bundle) => {
                  const courses = (bundle.courses as Array<string | Course>) ?? [];
                  const difficultySet = new Set<string>();
                  courses.forEach((course) => {
                    if (typeof course !== 'string' && course.difficulty) {
                      difficultySet.add(course.difficulty);
                    }
                  });

                  return (
                    <div key={bundle._id} className="flex flex-wrap gap-1">
                      {difficultySet.size > 0
                        ? Array.from(difficultySet).map((difficulty) => (
                            <Badge key={difficulty} variant="secondary" size="sm" className="capitalize">
                              {difficulty}
                            </Badge>
                          ))
                        : <span className="text-gray-400">—</span>}
                    </div>
                  );
                })}
              </ComparisonRow>
              <ComparisonRow label="Tags">
                {bundles.map((bundle) => (
                  <div key={bundle._id} className="flex flex-wrap gap-1">
                    {bundle.tags && bundle.tags.length > 0
                      ? bundle.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="secondary" size="sm" className="text-xs capitalize">
                            {tag}
                          </Badge>
                        ))
                      : <span className="text-gray-400">—</span>}
                  </div>
                ))}
              </ComparisonRow>
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};

const ComparisonRow: React.FC<{ label: string; children: React.ReactNode[] }> = ({ label, children }) => (
  <tr>
    <td className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400">
      {label}
    </td>
    {children.map((child, index) => (
      <td key={index} className="px-4 py-3 align-top">
        {child}
      </td>
    ))}
  </tr>
);

