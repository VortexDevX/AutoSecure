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
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);

  return isMobile;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

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

  if (isMobile && isDashboardPage) {
    return <MobileBlockScreen />;
  }

  return (
    <div className="app-shell selection:bg-primary/20 selection:text-slate-900">
      <div className="mesh-background absolute inset-0 opacity-80" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.24),_transparent_62%)]" />
      <LoadingBar />
      <div className="relative z-10 flex min-h-screen w-full">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col lg:pl-[5.5rem]">
          <SiteStatusBanner />
          <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-y-auto px-3 pb-4 pt-2 sm:px-4 lg:px-5 lg:pb-6">
            <div className="mx-auto max-w-[1560px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
