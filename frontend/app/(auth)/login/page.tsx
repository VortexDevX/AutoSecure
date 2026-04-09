'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/lib/utils/constants';
import toast from 'react-hot-toast';
import { ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { getErrorMessage } from '@/lib/api/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 10) {
      newErrors.password = 'Password must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await login(email, password);

      if (result.requiresTOTP) {
        toast.success('Password verified! Enter TOTP code.');
        router.push(ROUTES.VERIFY_TOTP);
      }
    } catch (error: any) {
      console.error('Login error:', error);

      const errorMessage = getErrorMessage(error);

      if (errorMessage.includes('deactivated')) {
        toast.error(errorMessage, {
          duration: 5000,
          icon: '🚫',
        });
      } else {
        toast.error(errorMessage, {
          duration: 4000,
        });
      }

      setErrors({
        password: errorMessage.includes('deactivated')
          ? 'Account deactivated'
          : 'Invalid credentials',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push(ROUTES.FORGOT_PASSWORD);
  };

  return (
    <div>
      <p className="section-label mb-3">Authentication</p>
      <h2 className="mb-2 text-3xl font-semibold tracking-[-0.05em] text-slate-900">
        Sign in
      </h2>
      <p className="mb-8 text-sm leading-7 text-slate-500">
        Enter your account credentials to continue.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label="Email Address"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors({ ...errors, email: undefined });
          }}
          error={errors.email}
          required
          autoComplete="email"
        />

        {/* Password field with eye toggle */}
        <div className="w-full">
          <label className="label label-required">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({ ...errors, password: undefined });
              }}
              required
              autoComplete="current-password"
              className={`input w-full pr-10 ${errors.password ? 'input-error' : ''}`}
              suppressHydrationWarning
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && <p className="error-message">{errors.password}</p>}
        </div>

        {/* Forgot Password link */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm font-medium text-primary-600 transition hover:text-primary-700"
          >
            Forgot Password?
          </button>
        </div>

        {/* Error Alert Box */}
        {errors.password && (
          <div className="glass-panel flex items-start gap-2 rounded-[22px] border border-danger/20 bg-danger-50/70 p-4">
            <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium">{errors.password}</p>
              {errors.password.includes('deactivated') && (
                <p className="text-xs mt-1">Contact the system owner to reactivate your account.</p>
              )}
            </div>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full justify-center"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
}
