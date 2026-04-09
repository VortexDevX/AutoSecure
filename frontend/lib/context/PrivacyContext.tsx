'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

interface PrivacyContextType {
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  formatPrivacyValue: (value: string | number | undefined | null) => string | number | undefined | null;
  canTogglePrivacy: boolean;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);
const DEFAULT_PRIVACY_MODE = false;

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const { user, authSessionVersion } = useAuth();
  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'admin';
  const isPrivileged = isOwner || isAdmin;
  const privacySessionKey = `${authSessionVersion}:${user?.email || 'guest'}:${
    isPrivileged ? 'privileged' : 'restricted'
  }`;

  // Non-privileged users are always in privacy mode
  const [ownerPrivacyState, setOwnerPrivacyState] = useState({
    sessionKey: '',
    value: DEFAULT_PRIVACY_MODE,
  });
  const ownerPrivacyMode =
    ownerPrivacyState.sessionKey === privacySessionKey
      ? ownerPrivacyState.value
      : DEFAULT_PRIVACY_MODE;
  const isPrivacyMode = isPrivileged ? ownerPrivacyMode : true;

  const togglePrivacyMode = () => {
    if (isPrivileged) {
      setOwnerPrivacyState({
        sessionKey: privacySessionKey,
        value: !ownerPrivacyMode,
      });
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
