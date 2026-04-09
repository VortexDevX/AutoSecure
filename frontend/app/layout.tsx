import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';
import { NavigationProvider } from '@/lib/context/NavigationContext';
import { PrivacyProvider } from '@/lib/context/PrivacyContext';
import { Toaster } from 'react-hot-toast';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AutoSecure - Insurance Management',
  description: 'Automobile insurance policy management system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        <NavigationProvider>
          <AuthProvider>
            <PrivacyProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  className: 'glass-panel !rounded-[22px] !px-4 !py-3 !text-sm !text-slate-800',
                }}
              />
            </PrivacyProvider>
          </AuthProvider>
        </NavigationProvider>
      </body>
    </html>
  );
}
