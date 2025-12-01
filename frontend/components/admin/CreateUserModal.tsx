'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createUser } from '@/lib/api/users';
import { UserRole } from '@/lib/types/user'; // ✅ Import from types
import toast from 'react-hot-toast';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserRole: UserRole;
}

export function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
  currentUserRole,
}: CreateUserModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = currentUserRole === 'owner';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error('Email and password are required');
      return;
    }

    if (password.length < 10) {
      toast.error('Password must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser({
        email: email.trim(),
        password: password.trim(),
        full_name: fullName.trim() || undefined,
        role,
      });

      toast.success('User created successfully');
      setEmail('');
      setPassword('');
      setFullName('');
      setRole('user');
      onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setRole('user');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New User"
      description="Add a new user to the system"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          required
          helpText="User will login with this email"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 10 characters"
          required
          helpText="Must be at least 10 characters with mixed case, number, and symbol"
        />

        <Input
          label="Full Name (Optional)"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
        />

        <div>
          <label className="label label-required">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="input"
          >
            <option value="user">👤 User - Can view and manage policies</option>
            <option value="admin">🛡️ Admin - Can manage users and meta</option>
            {isOwner && <option value="owner">👑 Owner - Full system access</option>}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {!isOwner && 'Only owners can create owner accounts'}
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
