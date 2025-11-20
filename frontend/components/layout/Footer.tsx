import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-bold mb-4">🐿️ SquirrelSquad Academy</h3>
            <p className="text-gray-400 text-sm">
              Gamified learning platform with AI-generated courses and social features.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Learn</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/courses" className="hover:text-white transition-colors">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/learning-paths" className="hover:text-white transition-colors">
                  Learning Paths
                </Link>
              </li>
              <li>
                <Link href="/challenges" className="hover:text-white transition-colors">
                  Challenges
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/feed" className="hover:text-white transition-colors">
                  Feed
                </Link>
              </li>
              <li>
                <Link href="/forums" className="hover:text-white transition-colors">
                  Forums
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-white transition-colors">
                  Projects
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} SquirrelSquad Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

