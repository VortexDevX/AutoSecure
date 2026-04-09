'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES, STORAGE_KEYS } from '@/lib/utils/constants';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api/client';
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
      toast.error(getErrorMessage(error));
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
      <p className="section-label mb-3">Secure Access</p>
      <h2 className="mb-2 text-3xl font-semibold tracking-[-0.05em] text-slate-900">
        Two-factor authentication
      </h2>
      <p className="mb-8 text-sm leading-7 text-slate-500">
        {qrCode
          ? 'Scan QR code with Google Authenticator'
          : 'Enter the 6-digit code from your authenticator app'}
      </p>

      {qrCode && (
        <div className="glass-panel mb-6 rounded-[26px] p-5">
          <p className="mb-3 text-center text-sm font-medium text-slate-700">First Time Setup</p>
          <div className="flex justify-center mb-3">
            <Image
              src={qrCode}
              alt="TOTP QR Code"
              width={200}
              height={200}
              className="rounded-[20px] border-4 border-white shadow-[0_20px_45px_rgba(148,163,184,0.18)]"
            />
          </div>
          <p className="text-center text-xs text-slate-500">
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

        <Button type="submit" variant="primary" className="w-full justify-center" isLoading={isLoading}>
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </Button>

        <Button type="button" variant="ghost" className="w-full justify-center" onClick={handleBack}>
          ← Back to Login
        </Button>
      </form>

      <div className="glass-panel mt-6 rounded-[24px] border border-accent/20 bg-accent-50/70 p-4">
        <p className="text-sm text-accent-900">
          <strong>Note:</strong> Enter the 6-digit code from your authenticator app.
          {qrCode && ' After scanning the QR code, the app will generate a code.'}
        </p>
      </div>
    </div>
  );
}
