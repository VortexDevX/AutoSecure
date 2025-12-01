'use client';

import { Spinner } from './Spinner';

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Spinner size="lg" />
      <p className="mt-4 text-sm text-gray-500">{message}</p>
    </div>
  );
}

// Full page overlay loader (for form submissions, etc.)
export function OverlayLoader({ message = 'Processing...' }: PageLoaderProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}
