'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNavigation } from '@/lib/context/NavigationContext';
import { ComponentProps } from 'react';

interface NavLinkProps extends ComponentProps<typeof Link> {
  children: React.ReactNode;
}

/**
 * A wrapper around Next.js Link that triggers the navigation loading bar.
 * Use this for internal navigation to show loading feedback immediately.
 */
export function NavLink({ href, onClick, children, ...props }: NavLinkProps) {
  const { startNavigation } = useNavigation();
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const hrefString = typeof href === 'string' ? href : href.pathname || '';

    // Only trigger loading if navigating to a different page
    if (hrefString !== pathname) {
      startNavigation();
    }

    // Call original onClick if provided
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
