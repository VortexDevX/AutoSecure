'use client';

import { useRouter } from 'next/navigation';
import { LicenseForm } from '@/components/licenses/LicenseForm';
import { createLicense } from '@/lib/api/licenses';
import { LicenseFormData } from '@/lib/types/license';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewLicensePage() {
  const router = useRouter();

  const handleSubmit = async (data: LicenseFormData) => {
    const license = await createLicense(data);
    toast.success('License created successfully');
    router.push(`/licenses/${license._id}`);
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/licenses">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New License</h1>
        </div>
      </div>

      {/* Form */}
      <LicenseForm onSubmit={handleSubmit} />
    </div>
  );
}
