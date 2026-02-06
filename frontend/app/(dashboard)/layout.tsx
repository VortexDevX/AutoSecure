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
    <div className="flex h-screen overflow-hidden bg-gray-50 relative selection:bg-primary-100 selection:text-primary-900">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent" />
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-100/40 via-transparent to-transparent" />

      <LoadingBar />

      {/* Main Container - Added padding for 'floating' feel on large screens */}
      <div className="flex w-full h-full relative z-10 lg:p-4 gap-4">
        {/* Sidebar - Floating on LG screens */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Content Area - Floating on LG screens */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white/50 lg:bg-transparent rounded-2xl">
          {/* Site Status Banner */}
          <SiteStatusBanner />

          {/* Topbar */}
          <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

          {/* Main Scrollable Area */}
          <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
            <div className="p-4 lg:p-0 lg:pt-2 max-w-[1600px] mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
