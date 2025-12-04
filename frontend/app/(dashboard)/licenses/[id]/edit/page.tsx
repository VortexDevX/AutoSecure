'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getLicenseById, updateLicense } from '@/lib/api/licenses';
import { LicenseRecord, LicenseFormData, LicenseDocument } from '@/lib/types/license';
import { LicenseForm } from '@/components/licenses/LicenseForm';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';

export default function EditLicensePage() {
  const params = useParams();
  const router = useRouter();
  const [license, setLicense] = useState<LicenseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLicense = async () => {
      try {
        setIsLoading(true);
        const data = await getLicenseById(params.id as string);
        setLicense(data);
      } catch (error: unknown) {
        const err = error as Error;
        toast.error(err.message || 'Failed to fetch license');
        router.push('/licenses');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchLicense();
    }
  }, [params.id, router]);

  const handleSubmit = async (data: LicenseFormData) => {
    const formData = new FormData();

    // Append all fields except documents
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'documents' || key === 'existing_documents') return;
      if (value === undefined || value === null || value === '') return;

      if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else if (typeof value === 'boolean') {
        formData.append(key, String(value));
      } else if (typeof value === 'number') {
        formData.append(key, String(value));
      } else {
        formData.append(key, String(value).toUpperCase());
      }
    });

    // Find deleted documents
    if (license?.documents) {
      const existingIds = data.existing_documents?.map((d) => d.file_id) || [];
      const deletedDocs = license.documents
        .filter((doc) => !existingIds.includes(doc.file_id))
        .map((doc) => doc.file_id);

      if (deletedDocs.length > 0) {
        formData.append('delete_documents', JSON.stringify(deletedDocs));
      }
    }

    // Handle new documents with labels
    if (data.documents && data.documents.length > 0) {
      const labels: string[] = [];
      data.documents.forEach((doc) => {
        formData.append('documents', doc.file);
        labels.push(doc.label);
      });
      formData.append('document_labels', JSON.stringify(labels));
    }

    await apiClient.patch(`/api/v1/licenses/${params.id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    toast.success('License updated successfully');
    router.push(`/licenses/${params.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!license) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">License not found</p>
        <Link href="/licenses" className="text-primary hover:underline mt-2 inline-block">
          Back to licenses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/licenses/${license._id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit License</h1>
          <p className="text-gray-600">
            {license.lic_no} - {license.customer_name || 'No name'}
          </p>
        </div>
      </div>

      {/* Form */}
      <LicenseForm initialData={license} onSubmit={handleSubmit} isEdit />
    </div>
  );
}
