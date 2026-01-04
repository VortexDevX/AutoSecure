'use client';

import { createContext, useContext, useState, useCallback, useEffect, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

interface NavigationContextType {
  isNavigating: boolean;
  startNavigation: () => void;
  navigate: (href: string) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  // End navigation when pathname changes (navigation completed)
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      // Don't navigate if already on that page
      if (href === pathname) return;

      setIsNavigating(true);
      startTransition(() => {
        router.push(href);
      });
    },
    [pathname, router]
  );

  // Also track isPending from useTransition
  const loading = isNavigating || isPending;

  return (
    <NavigationContext.Provider value={{ isNavigating: loading, startNavigation, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}

export function NavLink({ href, children, className, onClick, ...props }: NavLinkProps) {
  const { startNavigation } = useNavigation();

  const handleClick = (e: React.MouseEvent) => {
    startNavigation();
    if (onClick) onClick();
  };

  return (
    <Link href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
