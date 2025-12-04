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
    const formData = new FormData();

    // Append all fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'documents' && Array.isArray(value)) {
        // Handle file uploads
        value.forEach((file: File) => {
          formData.append('documents', file);
        });
      } else if (value !== undefined && value !== null && value !== '') {
        if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const license = await createLicense(formData);
    toast.success('License created successfully');
    router.push(`/licenses/${license._id}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/licenses">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New License</h1>
          <p className="text-gray-600">Create a new driving license record</p>
        </div>
      </div>

      {/* Form */}
      <LicenseForm onSubmit={handleSubmit} />
    </div>
  );
}
