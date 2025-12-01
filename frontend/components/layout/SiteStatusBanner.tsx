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
    <div className="bg-danger text-white text-center py-2 font-bold text-sm">
      🚫 {settings.maintenance_message || 'Site is currently DISABLED'}
    </div>
  );
}
