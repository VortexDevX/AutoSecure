'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PrivacyContextType {
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  formatPrivacyValue: (value: string | number | undefined | null) => string | number | undefined | null;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => !prev);
  };

  const formatPrivacyValue = (value: string | number | undefined | null) => {
    if (isPrivacyMode && value !== undefined && value !== null) {
      return '****';
    }
    return value;
  };

  return (
    <PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacyMode, formatPrivacyValue }}>
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
