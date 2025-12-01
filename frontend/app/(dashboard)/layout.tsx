'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { SiteStatusBanner } from '@/components/layout/SiteStatusBanner';
import { LoadingBar } from '@/components/ui/LoadingBar';
import { ROUTES } from '@/lib/utils/constants';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <LoadingBar />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Site Status Banner */}
        <SiteStatusBanner />

        {/* Topbar */}
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
