import Link from 'next/link';
import Header from '@/components/layout/Header';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-900">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-gray-800 to-gray-900 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl font-bold tracking-tight text-gray-100 sm:text-6xl">
                Welcome to SquirrelSquad Academy
              </h1>
              <p className="mt-6 text-xl leading-8 text-gray-300">
                Gamified learning platform with AI-generated courses, automated grading,
                and social features to make learning fun and engaging.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/register"
                  className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Get started
                </Link>
                <Link
                  href="/courses"
                  className="text-base font-semibold leading-6 text-gray-300 hover:text-gray-100"
                >
                  Browse courses <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-100 sm:text-4xl">
                Everything you need to learn
              </h2>
              <p className="mt-4 text-lg text-gray-400">
                A comprehensive platform with powerful features to support your learning journey
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-sm">
                <div className="text-3xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold text-gray-100">AI-Generated Courses</h3>
                <p className="mt-2 text-gray-400">
                  Learn from courses created by AI, tailored to your learning style and goals.
                </p>
              </div>

              <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-sm">
                <div className="text-3xl mb-4">🎮</div>
                <h3 className="text-xl font-semibold text-gray-100">Gamification</h3>
                <p className="mt-2 text-gray-400">
                  Earn XP, unlock achievements, and collect badges as you progress through courses.
                </p>
              </div>

              <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-sm">
                <div className="text-3xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-100">Social Learning</h3>
                <p className="mt-2 text-gray-400">
                  Connect with other learners, share projects, and learn together in a community.
                </p>
              </div>

              <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-sm">
                <div className="text-3xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-gray-100">Automated Grading</h3>
                <p className="mt-2 text-gray-400">
                  Get instant feedback on your assignments with AI-powered automated grading.
                </p>
              </div>

              <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-sm">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-100">Learning Analytics</h3>
                <p className="mt-2 text-gray-400">
                  Track your progress, identify strengths, and see detailed analytics about your learning.
                </p>
              </div>

              <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-sm">
                <div className="text-3xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-100">Personalized Paths</h3>
                <p className="mt-2 text-gray-400">
                  Get personalized learning paths based on your goals and current knowledge level.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">© 2024 SquirrelSquad Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
