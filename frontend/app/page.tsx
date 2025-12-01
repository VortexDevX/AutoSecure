'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');

    if (token) {
      // Redirect to dashboard if logged in
      router.replace('/dashboard');
    } else {
      // Redirect to login if not logged in
      router.replace('/login');
    }
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
