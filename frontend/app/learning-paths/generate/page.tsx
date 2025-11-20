'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Target, Clock3, Lightbulb, ListChecks, Plus, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Breadcrumbs } from '@/components/layout';
import { useGenerateLearningPath } from '@/hooks/useLearningPaths';
import { useAuth } from '@/hooks/useAuth';
import type { LearningPath, Course } from '@/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorMessage,
  Input,
  LoadingSpinner,
  Select,
  Textarea,
} from '@/components/ui';

type SupportPreference = 'project-based' | 'mentor-support' | 'career-support' | 'accountability';

type FormState = {
  goal: string;
  targetRole: string;
  learningStyle: string;
  timeCommitment: string;
  experienceLevel: string;
  preferredStack: string;
  availableHours: string;
  deadline: string;
  constraints: string;
};

type PresetConfig = {
  label: string;
  description: string;
  formValues: Partial<FormState>;
  focusAreas?: string[];
  supportPreferences?: SupportPreference[];
};

type GeneratePayload = {
  goal: string;
  learningStyle?: string;
  timeCommitment?: string;
  experienceLevel?: string;
  targetRole?: string;
  availableHours?: string;
  deadline?: string;
  constraints?: string;
  focusAreas?: string[];
  preferredTechnologies?: string[];
  supportPreferences?: SupportPreference[];
};

type StringPayloadField =
  | 'learningStyle'
  | 'timeCommitment'
  | 'experienceLevel'
  | 'targetRole'
  | 'availableHours'
  | 'deadline'
  | 'constraints';

const initialFormState: FormState = {
  goal: '',
  targetRole: '',
  learningStyle: '',
  timeCommitment: '',
  experienceLevel: '',
  preferredStack: '',
  availableHours: '',
  deadline: '',
  constraints: '',
};

const learningStyleOptions = [
  { value: '', label: 'Select learning style...' },
  { value: 'visual', label: 'Visual' },
  { value: 'hands-on', label: 'Hands-on' },
  { value: 'theoretical', label: 'Theoretical' },
  { value: 'mixed', label: 'Mixed' },
];

const timeCommitmentOptions = [
  { value: '', label: 'Select time commitment...' },
  { value: '1-2', label: '1-2 hours per week' },
  { value: '3-5', label: '3-5 hours per week' },
  { value: '6-10', label: '6-10 hours per week' },
  { value: '10+', label: '10+ hours per week' },
];

const experienceOptions = [
  { value: '', label: 'Select experience...' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const supportOptions: { value: SupportPreference; label: string }[] = [
  { value: 'project-based', label: 'Project-based practice' },
  { value: 'mentor-support', label: 'Mentor feedback' },
  { value: 'career-support', label: 'Career coaching' },
  { value: 'accountability', label: 'Accountability check-ins' },
];

const focusSuggestions = [
  'Portfolio Projects',
  'Interview Prep',
  'System Design',
  'AI Fundamentals',
  'Cloud Certifications',
  'Data Structures',
];

const presets: PresetConfig[] = [
  {
    label: 'Full-stack career switch (18 weeks)',
    description: 'Hands-on roadmap with portfolio projects and interview prep.',
    formValues: {
      goal: 'I want to transition from customer success into a full-stack engineering role with a strong portfolio and mock interviews.',
      targetRole: 'Full-Stack Engineer',
      experienceLevel: 'beginner',
      learningStyle: 'hands-on',
      timeCommitment: '6-10',
      preferredStack: 'React, Node.js, TypeScript, PostgreSQL',
      availableHours: '12',
      constraints: 'Need guided projects, accountability, and a clear interview prep timeline.',
    },
    focusAreas: ['Portfolio Projects', 'Interview Prep', 'System Design'],
    supportPreferences: ['project-based', 'career-support', 'accountability'],
  },
  {
    label: 'AI/ML upskilling for web devs',
    description: 'Blend AI fundamentals with applied projects.',
    formValues: {
      goal: 'I build web apps today but want to ship AI-powered features and understand LLM operations.',
      targetRole: 'Product Engineer (AI focus)',
      experienceLevel: 'intermediate',
      learningStyle: 'mixed',
      timeCommitment: '3-5',
      preferredStack: 'Python, PyTorch, Next.js',
      availableHours: '6',
      constraints: 'Prefer short iterations with quick wins to demo to my team.',
    },
    focusAreas: ['AI Fundamentals', 'Applied Machine Learning', 'Prompt Engineering'],
    supportPreferences: ['project-based', 'mentor-support'],
  },
  {
    label: 'Cloud certification sprint',
    description: 'Structured AWS prep with labs and stress-free schedule.',
    formValues: {
      goal: 'Earn the AWS Solutions Architect Associate certification while solidifying real cloud deployments.',
      targetRole: 'Cloud Solutions Architect',
      experienceLevel: 'intermediate',
      learningStyle: 'visual',
      timeCommitment: '1-2',
      preferredStack: 'AWS, Terraform, Python',
      availableHours: '4',
      constraints: 'Need practice exams, weak-area drills, and lightweight weekend labs.',
    },
    focusAreas: ['Cloud Certifications', 'Infrastructure as Code', 'Architecture Patterns'],
    supportPreferences: ['mentor-support', 'accountability'],
  },
];

const MIN_GOAL_LENGTH = 25;

const extractErrorMessage = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message;
  }
  return undefined;
};

export default function GenerateLearningPathPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const generateMutation = useGenerateLearningPath();

  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [focusAreaInput, setFocusAreaInput] = useState('');
  const [supportPreferences, setSupportPreferences] = useState<SupportPreference[]>([]);
  const [result, setResult] = useState<LearningPath | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const orderedCourses = useMemo(() => {
    if (!result?.courses) return [];
    return [...result.courses].sort((a, b) => a.order - b.order);
  }, [result]);

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddFocusArea = () => {
    const value = focusAreaInput.trim();
    if (!value || focusAreas.includes(value)) return;
    setFocusAreas((prev) => [...prev, value]);
    setFocusAreaInput('');
  };

  const handleRemoveFocusArea = (area: string) => {
    setFocusAreas((prev) => prev.filter((item) => item !== area));
  };

  const toggleSupportPreference = (preference: SupportPreference) => {
    setSupportPreferences((prev) =>
      prev.includes(preference) ? prev.filter((item) => item !== preference) : [...prev, preference]
    );
  };

  const applyPreset = (preset: PresetConfig) => {
    setFormState((prev) => ({ ...prev, ...preset.formValues }));
    setFocusAreas(preset.focusAreas ?? []);
    setSupportPreferences(preset.supportPreferences ?? []);
    setResult(null);
    setErrorMessage(null);
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setFocusAreas([]);
    setSupportPreferences([]);
    setFocusAreaInput('');
    setResult(null);
    setErrorMessage(null);
  };

  const handleGenerate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      router.push('/login');
      return;
    }

    if (formState.goal.trim().length < MIN_GOAL_LENGTH) {
      setErrorMessage(`Please describe your goal in at least ${MIN_GOAL_LENGTH} characters so the AI has enough context.`);
      return;
    }

    setErrorMessage(null);
    setResult(null);

    const payload: GeneratePayload = {
      goal: formState.goal.trim(),
    };

    const optionalFields: Array<[StringPayloadField, string]> = [
      ['learningStyle', formState.learningStyle],
      ['timeCommitment', formState.timeCommitment],
      ['experienceLevel', formState.experienceLevel],
      ['targetRole', formState.targetRole],
      ['availableHours', formState.availableHours],
      ['deadline', formState.deadline],
      ['constraints', formState.constraints],
    ];

    optionalFields.forEach(([key, value]) => {
      if (value) {
        payload[key] = value;
      }
    });

    if (focusAreas.length) {
      payload.focusAreas = focusAreas;
    }

    const preferredTechnologies = formState.preferredStack
      .split(',')
      .map((tech) => tech.trim())
      .filter(Boolean);
    if (preferredTechnologies.length) {
      payload.preferredTechnologies = preferredTechnologies;
    }

    if (supportPreferences.length) {
      payload.supportPreferences = [...supportPreferences];
    }

    try {
      const response = await generateMutation.mutateAsync(payload);
      const generatedPath = (response.data?.data ?? null) as LearningPath | null;

      if (generatedPath) {
        setResult(generatedPath);
      } else {
        setErrorMessage('Generation completed but the server did not return a learning path. Please try again.');
      }
    } catch (error: unknown) {
      const message = extractErrorMessage(error) ?? 'Failed to generate learning path';
      setErrorMessage(message);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <Card className="w-full max-w-md border-gray-700 bg-gray-800">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-100">Log in to generate your AI path</CardTitle>
              <p className="text-sm text-gray-400">
                We need your account so we can personalize the recommendation to your enrollments and progress.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <Button className="w-full" size="lg" onClick={() => router.push('/login')}>
                Go to login
              </Button>
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
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Learning Paths', href: '/learning-paths' },
              { label: 'Generate AI Path' },
            ]}
          />

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <form onSubmit={handleGenerate} className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Target className="h-6 w-6 text-blue-400" />
                    <div>
                      <CardTitle className="text-2xl text-gray-100">Tell us about your goal</CardTitle>
                      <p className="text-sm text-gray-400">
                        The more context you share, the more tailored your roadmap will be.
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {errorMessage && (
                    <ErrorMessage
                      message={errorMessage}
                      className="bg-red-900/40 border border-red-700"
                      onRetry={() => setErrorMessage(null)}
                    />
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">What do you want to achieve?</label>
                    <Textarea
                      value={formState.goal}
                      onChange={(e) => handleInputChange('goal', e.target.value)}
                      className="border-gray-700 bg-gray-900 text-gray-100 placeholder:text-gray-500"
                      placeholder="e.g., I want to become a backend engineer who can design scalable APIs and pass mid-level interviews..."
                      rows={5}
                      required
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Include your current role, obstacles, and what success looks like. Minimum {MIN_GOAL_LENGTH}+ characters.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Target role or outcome"
                      placeholder="e.g., Senior Frontend Engineer"
                      value={formState.targetRole}
                      onChange={(e) => handleInputChange('targetRole', e.target.value)}
                    />
                    <Select
                      label="Experience level"
                      options={experienceOptions}
                      value={formState.experienceLevel}
                      onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Select
                      label="Learning style"
                      options={learningStyleOptions}
                      value={formState.learningStyle}
                      onChange={(e) => handleInputChange('learningStyle', e.target.value)}
                    />
                    <Select
                      label="Weekly time commitment"
                      options={timeCommitmentOptions}
                      value={formState.timeCommitment}
                      onChange={(e) => handleInputChange('timeCommitment', e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Hours available per week"
                      type="number"
                      min="1"
                      placeholder="e.g., 8"
                      value={formState.availableHours}
                      onChange={(e) => handleInputChange('availableHours', e.target.value)}
                    />
                    <Input
                      label="Ideal completion date"
                      type="date"
                      value={formState.deadline}
                      onChange={(e) => handleInputChange('deadline', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <ListChecks className="h-6 w-6 text-emerald-400" />
                    <div>
                      <CardTitle className="text-2xl text-gray-100">Preferences & constraints</CardTitle>
                      <p className="text-sm text-gray-400">Fine-tune the path with focus areas and support needs.</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Input
                    label="Preferred tools / stack (comma separated)"
                    placeholder="e.g., React, Node.js, GraphQL, AWS"
                    value={formState.preferredStack}
                    onChange={(e) => handleInputChange('preferredStack', e.target.value)}
                    helperText="Helps us align courses with the technologies you care about."
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Key focus areas</label>
                    <div className="flex gap-3">
                      <Input
                        placeholder="Add a focus area"
                        value={focusAreaInput}
                        onChange={(e) => setFocusAreaInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddFocusArea();
                          }
                        }}
                      />
                      <Button type="button" variant="secondary" onClick={handleAddFocusArea}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {focusAreas.map((area) => (
                        <span
                          key={area}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200"
                        >
                          {area}
                          <button
                            type="button"
                            onClick={() => handleRemoveFocusArea(area)}
                            className="text-emerald-200/80 hover:text-emerald-100"
                            aria-label={`Remove ${area}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-400">
                      {focusSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            if (!focusAreas.includes(suggestion)) {
                              setFocusAreas((prev) => [...prev, suggestion]);
                            }
                          }}
                          className="rounded-full border border-gray-700 px-3 py-1 hover:border-gray-500 hover:text-gray-200"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-300">Support preferences</p>
                    <div className="flex flex-wrap gap-2">
                      {supportOptions.map((option) => {
                        const isSelected = supportPreferences.includes(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleSupportPreference(option.value)}
                            className={`rounded-full px-3 py-1 text-sm transition ${
                              isSelected
                                ? 'bg-blue-600/20 text-blue-200 border border-blue-500/60'
                                : 'border border-gray-700 text-gray-300 hover:border-gray-500'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Constraints or notes (optional)</label>
                    <Textarea
                      value={formState.constraints}
                      onChange={(e) => handleInputChange('constraints', e.target.value)}
                      className="border-gray-700 bg-gray-900 text-gray-100 placeholder:text-gray-500"
                      rows={3}
                      placeholder="e.g., Limited weekend availability, prefer text-based content, preparing for interviews in 3 months..."
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" size="lg" isLoading={generateMutation.isPending}>
                  Generate learning path
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Reset form
                </Button>
                {result && (
                  <Button type="button" variant="outline" onClick={() => router.push(`/learning-paths/${result._id}`)}>
                    View full path
                  </Button>
                )}
              </div>
            </form>

            <div className="space-y-6">
              <Card>
                <CardHeader className="flex-row items-center gap-3 space-y-0">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                  <div>
                    <CardTitle className="text-gray-100">Jump-start with templates</CardTitle>
                    <p className="text-sm text-gray-400">Prefill the form with curated scenarios.</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {presets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-left transition hover:border-gray-500"
                    >
                      <p className="text-sm font-semibold text-gray-100">{preset.label}</p>
                      <p className="text-xs text-gray-400">{preset.description}</p>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center gap-3 space-y-0">
                  <ListChecks className="h-6 w-6 text-emerald-400" />
                  <div>
                    <CardTitle className="text-gray-100">AI recommendation</CardTitle>
                    <p className="text-sm text-gray-400">Preview the generated journey.</p>
                  </div>
                </CardHeader>
                {generateMutation.isPending ? (
                  <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                    <LoadingSpinner />
                    <p className="text-sm text-gray-400">
                      Mapping your modules, milestones, and assessment checkpoints...
                    </p>
                  </CardContent>
                ) : result ? (
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Suggested path</p>
                      <h3 className="text-xl font-semibold text-gray-100">{result.name}</h3>
                      <p className="text-sm text-gray-400">{result.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.type && <Badge variant="info">{result.type}</Badge>}
                      {result.difficulty && (
                        <Badge variant="secondary" className="capitalize">
                          {result.difficulty}
                        </Badge>
                      )}
                      {result.estimatedDuration > 0 && (
                        <Badge variant="secondary">
                          <Clock3 className="mr-1 h-4 w-4" />
                          {result.estimatedDuration} hrs
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-300">First milestones</p>
                      <div className="space-y-2">
                        {orderedCourses.slice(0, 4).map((courseItem, index) => {
                          const rawCourse = courseItem.course;
                          const course =
                            typeof rawCourse === 'object' && rawCourse !== null ? (rawCourse as Course) : null;
                          const title = course?.title ?? `Course ${index + 1}`;

                          return (
                            <div
                              key={courseItem.order + title}
                              className="flex items-center justify-between rounded-lg border border-gray-700 px-3 py-2 text-sm"
                            >
                              <div>
                                <p className="font-medium text-gray-100">{title}</p>
                                <p className="text-xs text-gray-400">
                                  {course?.difficulty ? `${course.difficulty} • ` : ''}
                                  {courseItem.isRequired ? 'Required' : 'Optional'}
                                </p>
                              </div>
                              <Badge variant={courseItem.isRequired ? 'success' : 'secondary'}>
                                #{courseItem.order + 1}
                              </Badge>
                            </div>
                          );
                        })}
                        {orderedCourses.length === 0 && (
                          <p className="text-sm text-gray-500">Courses will appear here after generation.</p>
                        )}
                      </div>
                    </div>
                    {result.milestones && result.milestones.length > 0 && (
                      <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-3 text-sm text-gray-300">
                        <p className="font-medium text-gray-200">Milestones</p>
                        <p className="text-xs text-gray-400">
                          {result.milestones.length} milestone{result.milestones.length > 1 ? 's' : ''} highlighted for
                          this plan.
                        </p>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="primary"
                      className="w-full"
                      onClick={() => router.push(`/learning-paths/${result._id}`)}
                    >
                      View full learning path
                    </Button>
                  </CardContent>
                ) : (
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-400">
                      Once you submit the form, your personalized roadmap will appear here with a quick summary of the
                      first courses and milestones.
                    </p>
                    <div className="rounded-lg border border-dashed border-gray-700 p-4 text-sm text-gray-500">
                      Tip: mention where you are today, your target role, and any deadlines to get a more precise plan.
                    </div>
                  </CardContent>
                )}
              </Card>

              <Card>
                <CardHeader className="flex-row items-center gap-3 space-y-0">
                  <Lightbulb className="h-6 w-6 text-amber-400" />
                  <div>
                    <CardTitle className="text-gray-100">Prompting tips</CardTitle>
                    <p className="text-sm text-gray-400">What helps the AI craft better plans</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-400">
                  <p>• Include your current level, stack, and blockers (e.g., “comfortable with React but weak on APIs”).</p>
                  <p>• Share real constraints: available hours, deadline, or preferred learning mediums.</p>
                  <p>• Call out outcomes such as certifications, interviews, or portfolio goals.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

