'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

interface PrivacyContextType {
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  formatPrivacyValue: (value: string | number | undefined | null) => string | number | undefined | null;
  canTogglePrivacy: boolean;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'admin';
  const isPrivileged = isOwner || isAdmin;

  // Non-privileged users are always in privacy mode
  const [ownerPrivacyMode, setOwnerPrivacyMode] = useState(false);
  const isPrivacyMode = isPrivileged ? ownerPrivacyMode : true;

  const togglePrivacyMode = () => {
    if (isPrivileged) {
      setOwnerPrivacyMode((prev) => !prev);
    }
    // Regular users can't toggle
  };

  const formatPrivacyValue = (value: string | number | undefined | null) => {
    // Safety check: if user is explicitly a regular 'user', ALWAYS mask.
    if (user?.role === 'user' && value !== undefined && value !== null) {
      return '****';
    }
    if (isPrivacyMode && value !== undefined && value !== null) {
      return '****';
    }
    return value;
  };

  return (
    <PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacyMode, formatPrivacyValue, canTogglePrivacy: isPrivileged }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}
