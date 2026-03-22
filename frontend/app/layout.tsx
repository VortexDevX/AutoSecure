import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';
import { NavigationProvider } from '@/lib/context/NavigationContext';
import { PrivacyProvider } from '@/lib/context/PrivacyContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>
        <NavigationProvider>
          <AuthProvider>
            <PrivacyProvider>
              {children}
              <Toaster position="top-right" />
            </PrivacyProvider>
          </AuthProvider>
        </NavigationProvider>
      </body>
    </html>
  );
}
