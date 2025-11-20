'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { PageHeader, Breadcrumbs } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Textarea, Input, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useMentorApplication, useSubmitMentorApplication } from '@/hooks/useMentorship';

const timezones = [
  'UTC-8',
  'UTC-5',
  'UTC',
  'UTC+1',
  'UTC+5:30',
  'UTC+8',
  'UTC+10',
];

const preferredSlots = ['Morning', 'Afternoon', 'Evening', 'Weekends'];

const extractErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
};

export default function MentorApplicationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: existingApplication, isLoading } = useMentorApplication();
  const submitMutation = useSubmitMentorApplication();

  const [motivation, setMotivation] = useState('');
  const [experience, setExperience] = useState('');
  const [specialtiesInput, setSpecialtiesInput] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('3');
  const [timezone, setTimezone] = useState('UTC');
  const [selectedSlots, setSelectedSlots] = useState<string[]>(['Evening']);
  const [maxMentees, setMaxMentees] = useState('3');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const specialties = useMemo(
    () =>
      specialtiesInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [specialtiesInput]
  );

  const toggleSlot = (slot: string) => {
    setSelectedSlots((prev) => (prev.includes(slot) ? prev.filter((entry) => entry !== slot) : [...prev, slot]));
  };

  const handleSubmit = async () => {
    if (!motivation.trim() || !experience.trim()) {
      setErrorMessage('Please complete the motivation and experience sections.');
      return;
    }

    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await submitMutation.mutateAsync({
        motivation: motivation.trim(),
        experience: experience.trim(),
        specialties,
        maxMentees: maxMentees ? Number(maxMentees) : undefined,
        availability: {
          hoursPerWeek: hoursPerWeek ? Number(hoursPerWeek) : undefined,
          timezone,
          preferredTimes: selectedSlots,
        },
      });
      setSuccessMessage('Application submitted! We’ll notify you once it’s reviewed.');
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    }
  };

  if (!user) {
    router.replace('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Mentorship', href: '/mentorship' },
              { label: 'Mentor Application' },
            ]}
          />
          <PageHeader
            title="Apply to become a mentor"
            description="Share your expertise, availability, and goals for mentoring the SquirrelSquad community."
          />

          <Card className="mt-6 border-gray-800 bg-gray-850 text-gray-200">
            <CardHeader>
              <CardTitle>About you</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Why do you want to mentor?</label>
                <Textarea
                  rows={4}
                  placeholder="Share your motivation, mentoring style, and what mentees can expect from working with you."
                  value={motivation}
                  onChange={(event) => setMotivation(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">What’s your experience?</label>
                <Textarea
                  rows={4}
                  placeholder="Highlight key projects, accomplishments, and topics you can guide mentees through."
                  value={experience}
                  onChange={(event) => setExperience(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Specialties (comma separated)</label>
                <Input
                  placeholder="Frontend architecture, data structures, portfolio reviews"
                  value={specialtiesInput}
                  onChange={(event) => setSpecialtiesInput(event.target.value)}
                />
                {specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6 border-gray-800 bg-gray-850 text-gray-200">
            <CardHeader>
              <CardTitle>Availability & logistics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Hours per week</label>
                <Input
                  type="number"
                  min="1"
                  value={hoursPerWeek}
                  onChange={(event) => setHoursPerWeek(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Timezone</label>
                <select
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
                >
                  {timezones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Preferred times</label>
                <div className="flex flex-wrap gap-2">
                  {preferredSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleSlot(slot)}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        selectedSlots.includes(slot)
                          ? 'border-blue-500 bg-blue-500/20 text-blue-200'
                          : 'border-gray-600 text-gray-400'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Max mentees at once</label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={maxMentees}
                  onChange={(event) => setMaxMentees(event.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {errorMessage && (
            <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="mt-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {successMessage}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => router.push('/mentorship')}>
              Back to mentorship hub
            </Button>
            <Button
              variant="primary"
              isLoading={submitMutation.isPending}
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {existingApplication ? 'Update application' : 'Submit application'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
