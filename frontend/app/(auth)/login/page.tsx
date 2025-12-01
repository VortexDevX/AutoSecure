'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/lib/utils/constants';
import toast from 'react-hot-toast';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    setErrors({}); // ✅ Clear previous errors

    try {
      const result = await login(email, password);

      if (result.requiresTOTP) {
        toast.success('Password verified! Enter TOTP code.');
        router.push(ROUTES.VERIFY_TOTP);
      }
    } catch (error: any) {
      console.error('Login error:', error);

      // ✅ IMPROVED: Show specific error messages
      const errorMessage = error?.message || 'Login failed. Please check your credentials.';

      // ✅ Show toast with specific styling based on error type
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

      // ✅ Set form error for visual feedback
      setErrors({
        password: errorMessage.includes('deactivated')
          ? 'Account deactivated'
          : 'Invalid credentials',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign In</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label="Email Address"
          placeholder="owner@autosecure.local"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors({ ...errors, email: undefined });
          }}
          error={errors.email}
          required
          autoComplete="email"
        />

        <Input
          type="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors({ ...errors, password: undefined });
          }}
          error={errors.password}
          required
          autoComplete="current-password"
        />

        {/* ✅ NEW: Error Alert Box */}
        {errors.password && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
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
          className="w-full"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
}
