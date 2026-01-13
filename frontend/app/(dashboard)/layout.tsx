'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { SiteStatusBanner } from '@/components/layout/SiteStatusBanner';
import { LoadingBar } from '@/components/ui/LoadingBar';
import { MobileBlockScreen } from '@/components/dashboard/MobileBlockScreen';
import { ROUTES } from '@/lib/utils/constants';

function useIsMobile(breakpoint: number = 1024) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return { isMobile, isClient };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile, isClient } = useIsMobile();

  // Only block mobile on dashboard page itself
  const isDashboardPage = pathname === '/dashboard';

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

  // Show mobile block screen only on dashboard page for small screens
  if (isClient && isMobile && isDashboardPage) {
    return <MobileBlockScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <LoadingBar />

      {/* Sidebar - will collapse on lg screens */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Site Status Banner */}
        <SiteStatusBanner />

        {/* Topbar */}
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
