import apiClient from './client';

export interface Branding {
  company_name: string;
  logo_path?: string;
  footer_text: string;
}

export interface SiteSettings {
  site_enabled: boolean;
  maintenance_message?: string;
  branding: Branding;
  updated_at?: string;
}

export interface SiteSettingsResponse {
  status: string;
  data: {
    settings: SiteSettings;
  };
}

export interface ToggleResponse {
  status: string;
  message: string;
  data: {
    settings: {
      site_enabled: boolean;
      maintenance_message?: string;
    };
  };
}

export interface BrandingResponse {
  success: boolean;
  message: string;
  data: {
    branding?: Branding;
    logo_path?: string;
  };
}

/**
 * Get current site settings
 */
export const getSettings = async (): Promise<SiteSettings> => {
  const response = await apiClient.get<SiteSettingsResponse>('/api/v1/settings');
  return response.data.data.settings;
};

/**
 * Toggle site enabled/disabled
 */
export const toggleSite = async (enabled: boolean): Promise<void> => {
  await apiClient.patch<ToggleResponse>('/api/v1/settings/toggle', { enabled });
};

/**
 * Update maintenance message
 */
export const updateMaintenanceMessage = async (message: string): Promise<void> => {
  await apiClient.patch('/api/v1/settings/message', { message });
};

/**
 * Update branding settings
 */
export const updateBranding = async (branding: Partial<Branding>): Promise<Branding> => {
  const response = await apiClient.patch<BrandingResponse>('/api/v1/settings/branding', branding);
  return response.data.data.branding!;
};

/**
 * Upload branding logo
 */
export const uploadLogo = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('logo', file);

  const response = await apiClient.post<BrandingResponse>(
    '/api/v1/settings/branding/logo',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data.logo_path || '';
};

/**
 * Get the API base URL
 */
export const getApiBaseUrl = (): string => {
  // Check for environment variable first
  if (typeof window !== 'undefined') {
    // Client-side: use the same origin or env variable
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

/**
 * Get logo URL with cache busting
 */
export const getLogoUrl = (timestamp?: number): string => {
  const baseUrl = getApiBaseUrl();
  const t = timestamp || Date.now();
  return `${baseUrl}/api/v1/settings/branding/logo?t=${t}`;
};

/**
 * Check if logo exists by making a HEAD request
 */
export const checkLogoExists = async (): Promise<boolean> => {
  try {
    const response = await apiClient.head('/api/v1/settings/branding/logo');
    return response.status === 200;
  } catch {
    return false;
  }
};
