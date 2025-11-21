'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { PageHeader } from '@/components/layout';
import { useCreateSupportTicket } from '@/hooks/useHelpSupport';
import { useCourses } from '@/hooks/useCourses';
import {
  Card,
  CardContent,
  Button,
  Input,
  Textarea,
  LoadingSpinner,
} from '@/components/ui';
import { showToast, getErrorMessage } from '@/lib/toast';
import type { TicketCategory, TicketPriority } from '@/lib/api/helpSupport';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'account', label: 'Account Issue' },
  { value: 'billing', label: 'Billing' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'course', label: 'Course Question' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'other', label: 'Other' },
];

const TICKET_PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function NewTicketPage() {
  const router = useRouter();
  const createTicket = useCreateSupportTicket();
  const { data: coursesData } = useCourses({});
  const courses = coursesData?.data || [];

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'technical' as TicketCategory,
    priority: 'normal' as TicketPriority,
    relatedCourse: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.description.trim()) {
      showToast.error('Please fill in all required fields');
      return;
    }

    try {
      const result = await createTicket.mutateAsync({
        subject: formData.subject,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        relatedCourse: formData.relatedCourse || undefined,
      });

      // Backend returns { success: true, ticket: {...} }
      // axios response: result.data = { success: true, data: { ticket: {...} } } or { success: true, ticket: {...} }
      const responseData = (result as any)?.data?.data || (result as any)?.data;
      const ticket = responseData?.ticket;
      if (ticket?._id) {
        router.push(`/help/tickets/${ticket._id}`);
      } else {
        // Fallback: redirect to help center
        router.push('/help');
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/help">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Help Center
          </Button>
        </Link>

        <PageHeader
          title="Create Support Ticket"
          description="Describe your issue and we'll get back to you as soon as possible."
        />

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject *
                </label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
                  className="block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  {TICKET_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                  className="block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  {TICKET_PRIORITIES.map((pri) => (
                    <option key={pri.value} value={pri.value}>
                      {pri.label}
                    </option>
                  ))}
                </select>
              </div>

              {courses.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Related Course (Optional)
                  </label>
                  <select
                    value={formData.relatedCourse}
                    onChange={(e) => setFormData({ ...formData, relatedCourse: e.target.value })}
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please provide as much detail as possible about your issue..."
                  rows={8}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-4">
                <Link href="/help">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={createTicket.isPending}
                >
                  {createTicket.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Ticket'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

