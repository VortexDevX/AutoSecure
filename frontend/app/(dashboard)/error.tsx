'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mb-6">
          <ExclamationTriangleIcon className="w-8 h-8 text-danger-600" />
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Something went wrong</h2>

        <p className="text-gray-600 mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>

        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => (window.location.href = '/dashboard')}>
            Go to Dashboard
          </Button>
          <Button variant="primary" onClick={reset}>
            Try Again
          </Button>
        </div>

        {error.digest && <p className="mt-6 text-xs text-gray-400">Error ID: {error.digest}</p>}
      </div>
    </div>
  );
}
