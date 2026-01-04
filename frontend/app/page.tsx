'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Spinner } from '@/components/ui/Spinner';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <Image
              src="/logo.png"
              alt="AutoSecure Logo"
              width={60}
              height={60}
              className="rounded-full"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AutoSecure</h1>
          <p className="text-gray-600 mt-2">Insurance Management System</p>
        </div>

        {/* Loading Card */}
        <div className="card card-hover">
          <div className="flex flex-col items-center justify-center py-8">
            <Spinner size="lg" />
            <p className="mt-4 text-sm text-gray-500">Redirecting...</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          © 2025 AutoSecure. All rights reserved.
        </p>
      </div>
    </div>
  );
}
