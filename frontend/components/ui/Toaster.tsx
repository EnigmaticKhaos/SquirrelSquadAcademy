'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'bg-gray-800 border border-gray-700 text-gray-100',
          title: 'text-gray-100',
          description: 'text-gray-400',
          success: 'bg-green-900/20 border-green-700',
          error: 'bg-red-900/20 border-red-700',
          warning: 'bg-yellow-900/20 border-yellow-700',
          info: 'bg-blue-900/20 border-blue-700',
          closeButton: 'text-gray-400 hover:text-gray-200 hover:bg-gray-700',
        },
      }}
    />
  );
}

