'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api/client';

interface SiteSettings {
  site_enabled: boolean;
  maintenance_message?: string;
}

export function SiteStatusBanner() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    // Fetch site settings
    const fetchSettings = async () => {
      try {
        const response = await apiClient.get('/api/v1/settings');
        setSettings(response.data.data.settings);
      } catch (error) {
        console.error('Failed to fetch site settings:', error);
      }
    };

    fetchSettings();
  }, []);

  // Only show banner if site is disabled
  if (!settings || settings.site_enabled) {
    return null;
  }

  return (
    <div className="px-3 pt-3 sm:px-4 lg:px-8">
      <div className="glass-panel flex items-center justify-center rounded-[24px] border border-danger/20 bg-danger-50/70 px-4 py-3 text-center text-sm font-medium text-danger-700">
        {settings.maintenance_message || 'Site is currently DISABLED'}
      </div>
    </div>
  );
}
