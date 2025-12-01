'use client';

import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface AccessDeniedProps {
  message?: string;
  showBackButton?: boolean;
}

export function AccessDenied({
  message = "You don't have permission to access this page.",
  showBackButton = true,
}: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <ShieldExclamationIcon className="w-10 h-10 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      {showBackButton && (
        <Button variant="primary" onClick={() => router.push('/dashboard')}>
          Go to Dashboard
        </Button>
      )}
    </div>
  );
}
