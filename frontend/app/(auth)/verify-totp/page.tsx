'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES, STORAGE_KEYS } from '@/lib/utils/constants';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function VerifyTOTPPage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);

  const { verifyTOTP } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Get email from localStorage
    const savedEmail = localStorage.getItem(STORAGE_KEYS.TOTP_EMAIL);
    if (!savedEmail) {
      // No email saved, redirect to login
      router.push(ROUTES.LOGIN);
      return;
    }
    setEmail(savedEmail);

    // Check if TOTP setup is needed (first time login)
    const setupData = sessionStorage.getItem('totp_setup');
    if (setupData) {
      const { qr_code } = JSON.parse(setupData);
      setQrCode(qr_code);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast.error('TOTP code must be 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      await verifyTOTP(email, code);
      // Clear TOTP setup data
      sessionStorage.removeItem('totp_setup');
      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error.message || 'Invalid TOTP code. Please try again.');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    localStorage.removeItem(STORAGE_KEYS.TOTP_EMAIL);
    sessionStorage.removeItem('totp_setup');
    router.push(ROUTES.LOGIN);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Two-Factor Authentication
      </h2>
      <p className="text-gray-600 text-center mb-6">
        {qrCode
          ? 'Scan QR code with Google Authenticator'
          : 'Enter the 6-digit code from your authenticator app'}
      </p>

      {qrCode && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-700 mb-3 text-center font-medium">First Time Setup</p>
          <div className="flex justify-center mb-3">
            <Image
              src={qrCode}
              alt="TOTP QR Code"
              width={200}
              height={200}
              className="border-4 border-white shadow-md rounded-lg"
            />
          </div>
          <p className="text-xs text-gray-500 text-center">
            Scan this QR code with Google Authenticator or Authy
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          label="TOTP Code"
          placeholder="000000"
          value={code}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setCode(value);
          }}
          maxLength={6}
          required
          autoFocus
          className="text-center text-2xl tracking-widest font-mono"
        />

        <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </Button>

        <Button type="button" variant="ghost" className="w-full" onClick={handleBack}>
          ← Back to Login
        </Button>
      </form>

      <div className="mt-6 p-4 bg-accent-50 rounded-lg border border-accent-200">
        <p className="text-sm text-accent-900">
          <strong>📱 Note:</strong> Enter the 6-digit code from your authenticator app.
          {qrCode && ' After scanning the QR code, the app will generate a code.'}
        </p>
      </div>
    </div>
  );
}
