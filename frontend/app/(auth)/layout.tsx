import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell app-content-scale flex min-h-screen items-center justify-center px-4 py-8">
      <div className="mesh-background absolute inset-0 opacity-85" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,248,240,0.42),_transparent_48%)]" />

      <div className="relative z-10 w-full max-w-md">
        <section className="glass-panel-strong px-6 py-8 sm:px-8">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-slate-900 shadow-[0_16px_28px_rgba(30,41,59,0.18)]">
              <Image src="/logo.png" alt="AutoSecure Logo" width={32} height={32} />
            </div>
            <p className="section-label mt-5">AutoSecure</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-900">
              Account access
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to continue.
            </p>
          </div>

          {children}
        </section>
      </div>
    </div>
  );
}
