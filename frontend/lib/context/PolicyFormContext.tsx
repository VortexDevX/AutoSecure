'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PolicyFormData } from '@/lib/types/policy';

interface PolicyFormContextType {
  formData: Partial<PolicyFormData>;
  updateFormData: (data: Partial<PolicyFormData>) => void;
  resetForm: () => void;
  setInitialData: (data: Partial<PolicyFormData>) => void;
}

const PolicyFormContext = createContext<PolicyFormContextType | undefined>(undefined);

const defaultFormData: Partial<PolicyFormData> = {
  payment_details: [],
  addon_coverage: [],
  other_documents: [],
};

export function PolicyFormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<Partial<PolicyFormData>>(defaultFormData);

  const updateFormData = useCallback((data: Partial<PolicyFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(defaultFormData);
  }, []);

  const setInitialData = useCallback((data: Partial<PolicyFormData>) => {
    setFormData({ ...defaultFormData, ...data });
  }, []);

  return (
    <PolicyFormContext.Provider value={{ formData, updateFormData, resetForm, setInitialData }}>
      {children}
    </PolicyFormContext.Provider>
  );
}

export function usePolicyForm() {
  const context = useContext(PolicyFormContext);
  if (!context) {
    throw new Error('usePolicyForm must be used within PolicyFormProvider');
  }
  return context;
}
