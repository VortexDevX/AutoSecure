'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/lib/utils/constants';
import toast from 'react-hot-toast';
import { ExclamationCircleIcon, EyeIcon, EyeSlashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Invalid email format');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await authApi.requestPasswordReset(email);
      if (result.success) {
        toast.success(result.message || 'OTP sent to your email');
        setStep('reset');
      } else {
        throw new Error(result.error || 'Failed to request OTP');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      setError('OTP is required');
      return;
    }
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }
    if (newPassword.length < 10) {
      setError('Password must be at least 10 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await authApi.resetPassword(email, otp, newPassword);
      
      if (result.success) {
        toast.success('Password successfully reset! You can now log in.');
        router.push(ROUTES.LOGIN);
      } else {
        throw new Error(result.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push(ROUTES.LOGIN)}
        className="mb-8 flex items-center text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Back to Login
      </button>

      <p className="section-label mb-3">Account Recovery</p>
      <h2 className="mb-2 text-3xl font-semibold tracking-[-0.05em] text-slate-900">
        {step === 'request' ? 'Forgot password' : 'Reset password'}
      </h2>
      <p className="mb-8 text-sm leading-7 text-slate-500">
        {step === 'request' 
          ? 'Enter your email address and we will send you a verification code.' 
          : 'Enter the 6-digit verification code sent to your email and choose a new password.'}
      </p>

      {error && (
        <div className="glass-panel mb-5 flex items-start gap-2 rounded-[22px] border border-danger/20 bg-danger-50/70 p-4">
          <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800 font-medium">{error}</div>
        </div>
      )}

      {step === 'request' ? (
        <form onSubmit={handleRequestOTP} className="space-y-4">
          <Input
            type="email"
            label="Email Address"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            required
            autoComplete="email"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Verification Code'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            label="Email Address"
            value={email}
            disabled
            className="bg-gray-50 text-gray-500"
          />

          <Input
            type="text"
            label="Verification Code (OTP)"
            placeholder="123456"
            maxLength={6}
            value={otp}
            onChange={(e) => {
              // allow only numbers
              const val = e.target.value.replace(/\D/g, '');
              setOtp(val);
              setError(null);
            }}
            required
            autoComplete="one-time-code"
            className="text-center text-xl tracking-widest"
          />

          <div className="w-full">
            <label className="label label-required">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError(null);
                }}
                required
                autoComplete="new-password"
                className="input w-full pr-10"
                suppressHydrationWarning
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                tabIndex={-1}
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="w-full">
            <label className="label label-required">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                required
                autoComplete="new-password"
                className="input w-full pr-10"
                suppressHydrationWarning
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Password must be at least 10 characters long.</p>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="mt-6 w-full justify-center"
            isLoading={isLoading}
            disabled={isLoading || !otp || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      )}
    </div>
  );
}
