'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Spinner } from '@/components/ui/Spinner';
import { STORAGE_KEYS } from '@/lib/utils/constants';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem(STORAGE_KEYS.SESSION_ACCESS_TOKEN);
    router.replace(token ? '/dashboard' : '/login');
  }, [router]);

  return (
    <div className="app-shell app-content-scale flex min-h-screen items-center justify-center px-4">
      <div className="mesh-background absolute inset-0 opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.52),_transparent_42%)]" />

      <div className="glass-panel-strong relative z-10 w-full max-w-xl px-8 py-10 text-center sm:px-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary-400 via-primary-500 to-primary-700 shadow-[0_24px_48px_rgba(99,102,241,0.25)]">
          <Image src="/logo.png" alt="AutoSecure Logo" width={42} height={42} />
        </div>

        <p className="section-label mt-6">AutoSecure</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-slate-900">
          Redirecting
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-500">
          Checking your session and sending you to the right page.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-[28px] bg-white/55 px-6 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-slate-500">Redirecting...</p>
        </div>
      </div>
    </div>
  );
}
