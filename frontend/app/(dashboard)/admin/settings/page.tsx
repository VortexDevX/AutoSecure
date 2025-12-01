'use client';

import { useState, useEffect, useRef } from 'react';
import { useRequireOwner } from '@/lib/hooks/useRequireRole';
import { AccessDenied } from '@/components/admin/AccessDenied';
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import {
  getSettings,
  toggleSite,
  updateMaintenanceMessage,
  updateBranding,
  uploadLogo,
  getLogoUrl,
  getApiBaseUrl,
  SiteSettings,
  Branding,
} from '@/lib/api/settings';
import {
  Cog6ToothIcon,
  ShieldExclamationIcon,
  PaintBrushIcon,
  PhotoIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { isAuthorized, isCheckingAuth } = useRequireOwner();

  // State
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [siteEnabled, setSiteEnabled] = useState(true);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [branding, setBranding] = useState<Branding>({
    company_name: 'AutoSecure',
    logo_path: '',
    footer_text: '© 2025 AutoSecure. All rights reserved.',
  });

  // Logo upload
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoTimestamp, setLogoTimestamp] = useState(Date.now());
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track changes
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch settings
  useEffect(() => {
    if (isAuthorized) {
      fetchSettings();
    }
  }, [isAuthorized]);

  // Track changes
  useEffect(() => {
    if (settings) {
      const changed =
        siteEnabled !== settings.site_enabled ||
        maintenanceMessage !== (settings.maintenance_message || '') ||
        branding.company_name !== settings.branding.company_name ||
        branding.footer_text !== settings.branding.footer_text;
      setHasChanges(changed);
    }
  }, [siteEnabled, maintenanceMessage, branding, settings]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await getSettings();
      setSettings(data);
      setSiteEnabled(data.site_enabled);
      setMaintenanceMessage(data.maintenance_message || '');
      setBranding(data.branding);

      // Set logo URL if logo_path exists
      if (data.branding.logo_path) {
        setLogoTimestamp(Date.now());
        setLogoError(false);
      }
    } catch (error: any) {
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSite = async () => {
    const newValue = !siteEnabled;

    try {
      setIsSaving(true);
      await toggleSite(newValue);
      setSiteEnabled(newValue);
      setSettings((prev) => (prev ? { ...prev, site_enabled: newValue } : prev));
      toast.success(`Site ${newValue ? 'enabled' : 'disabled'} successfully`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to toggle site');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMaintenanceMessage = async () => {
    try {
      setIsSaving(true);
      await updateMaintenanceMessage(maintenanceMessage);
      setSettings((prev) => (prev ? { ...prev, maintenance_message: maintenanceMessage } : prev));
      toast.success('Maintenance message updated');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update message');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    try {
      setIsSaving(true);
      const updated = await updateBranding({
        company_name: branding.company_name,
        footer_text: branding.footer_text,
      });
      setBranding(updated);
      setSettings((prev) => (prev ? { ...prev, branding: updated } : prev));
      setHasChanges(false);
      toast.success('Branding settings saved');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save branding');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('Only PNG and JPG files are allowed');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB');
      return;
    }

    // Create local preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreviewUrl(reader.result as string);
      setLogoError(false);
    };
    reader.readAsDataURL(file);

    // Upload
    handleLogoUpload(file);
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setIsUploadingLogo(true);
      const logoPath = await uploadLogo(file);

      // Update branding with new logo path
      setBranding((prev) => ({ ...prev, logo_path: logoPath }));
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              branding: { ...prev.branding, logo_path: logoPath },
            }
          : prev
      );

      // Update timestamp to bust cache
      setLogoTimestamp(Date.now());
      setLogoPreviewUrl(null); // Clear local preview, use server URL
      setLogoError(false);

      toast.success('Logo uploaded successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to upload logo');
      setLogoPreviewUrl(null);
    } finally {
      setIsUploadingLogo(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReset = () => {
    if (settings) {
      setSiteEnabled(settings.site_enabled);
      setMaintenanceMessage(settings.maintenance_message || '');
      setBranding(settings.branding);
      setHasChanges(false);
    }
  };

  // Determine logo source
  const getLogoSrc = (): string | null => {
    // If we have a local preview (during upload), use that
    if (logoPreviewUrl) {
      return logoPreviewUrl;
    }

    // If logo_path exists and no error, use server URL
    if (branding.logo_path && !logoError) {
      return `${getApiBaseUrl()}/api/v1/settings/branding/logo?t=${logoTimestamp}`;
    }

    return null;
  };

  const logoSrc = getLogoSrc();

  if (isCheckingAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <AccessDenied message="Only owners can access site settings." />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-gray-600 mt-1">Manage site-wide configuration and branding</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-amber-600 font-medium flex items-center gap-1">
              <ExclamationTriangleIcon className="w-4 h-4" />
              Unsaved changes
            </span>
          )}
          <Button variant="ghost" onClick={handleReset} disabled={!hasChanges || isSaving}>
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Site Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldExclamationIcon className="w-5 h-5 text-gray-600" />
            <CardTitle>Site Status</CardTitle>
          </div>
          <CardDescription>Control site availability and maintenance mode</CardDescription>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Site Enabled</p>
              <p className="text-sm text-gray-500">
                {siteEnabled
                  ? 'Site is accessible to all users'
                  : 'Only owners can access the site'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleSite}
              disabled={isSaving}
              className={`
                relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                ${siteEnabled ? 'bg-green-500' : 'bg-red-500'}
                ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span
                className={`
                  inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform
                  ${siteEnabled ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Status Badge */}
          <div
            className={`
            flex items-center gap-3 p-4 rounded-lg border-2
            ${siteEnabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
          `}
          >
            {siteEnabled ? (
              <>
                <CheckIcon className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Site is Online</p>
                  <p className="text-sm text-green-700">All users can access the application</p>
                </div>
              </>
            ) : (
              <>
                <XMarkIcon className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">Site is Offline</p>
                  <p className="text-sm text-red-700">Only owners can access the application</p>
                </div>
              </>
            )}
          </div>

          {/* Maintenance Message */}
          <div className="space-y-3">
            <label className="label">Maintenance Message</label>
            <textarea
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="Enter message to show when site is disabled..."
              className="input min-h-[100px] resize-none"
            />
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveMaintenanceMessage}
                isLoading={isSaving}
                disabled={maintenanceMessage === (settings?.maintenance_message || '')}
              >
                Save Message
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Branding Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PaintBrushIcon className="w-5 h-5 text-gray-600" />
            <CardTitle>Branding</CardTitle>
          </div>
          <CardDescription>Customize your company branding</CardDescription>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="label">Company Logo</label>
            <div className="flex items-start gap-6">
              {/* Logo Preview */}
              <div className="relative w-32 h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt="Company Logo"
                    className="w-full h-full object-contain p-2"
                    onError={() => {
                      console.warn('Logo failed to load, will show placeholder');
                      setLogoError(true);
                      setLogoPreviewUrl(null);
                    }}
                  />
                ) : (
                  <PhotoIcon className="w-12 h-12 text-gray-400" />
                )}
                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Spinner size="md" />
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                  {logoSrc ? 'Change Logo' : 'Upload Logo'}
                </Button>
                <p className="text-xs text-gray-500">
                  Recommended: Square image, PNG or JPG, max 2MB
                </p>
                {logoError && (
                  <p className="text-xs text-amber-600">
                    Could not load logo from server. Try uploading a new one.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Company Name */}
          <Input
            label="Company Name"
            value={branding.company_name}
            onChange={(e) => setBranding({ ...branding, company_name: e.target.value })}
            placeholder="Enter company name"
          />

          {/* Footer Text */}
          <Input
            label="Footer Text"
            value={branding.footer_text}
            onChange={(e) => setBranding({ ...branding, footer_text: e.target.value })}
            placeholder="© 2025 Company Name. All rights reserved."
          />

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              variant="primary"
              onClick={handleSaveBranding}
              isLoading={isSaving}
              disabled={!hasChanges}
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              Save Branding
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Info Card */}
      <Card>
        <CardBody>
          <div className="flex gap-3 text-sm">
            <Cog6ToothIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 mb-1">About Site Settings</p>
              <ul className="text-gray-600 space-y-1">
                <li>
                  • <strong>Site Status:</strong> Disable the site to prevent access during
                  maintenance
                </li>
                <li>
                  • <strong>Maintenance Message:</strong> Shown to non-owners when site is disabled
                </li>
                <li>
                  • <strong>Company Name:</strong> Used in emails and throughout the application
                </li>
                <li>
                  • <strong>Logo:</strong> Displayed in the sidebar and email headers
                </li>
                <li>
                  • <strong>Footer Text:</strong> Displayed at the bottom of emails
                </li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
