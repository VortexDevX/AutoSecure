'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { LicenseFormData, LicenseRecord, LicenseDocument } from '@/lib/types/license';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SingleDatePicker } from '@/components/ui/DatePicker';
import { Card } from '@/components/ui/Card';
import {
  DocumentIcon,
  UserIcon,
  PhoneIcon,
  CurrencyRupeeIcon,
  XMarkIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface LicenseFormProps {
  initialData?: LicenseRecord;
  onSubmit: (data: LicenseFormData) => Promise<void>;
  isEdit?: boolean;
}

const FACELESS_OPTIONS = [
  { value: 'faceless', label: 'Faceless' },
  { value: 'non-faceless', label: 'Non-Faceless' },
  { value: 'reminder', label: 'Reminder' },
];

const APPROVED_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

interface NewDocument {
  file: File;
  label: string;
}

export function LicenseForm({ initialData, onSubmit, isEdit = false }: LicenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDocs, setNewDocs] = useState<NewDocument[]>([]);
  const [existingDocs, setExistingDocs] = useState<LicenseDocument[]>(initialData?.documents || []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LicenseFormData>({
    defaultValues: {
      lic_no: initialData?.lic_no || '',
      application_no: initialData?.application_no || '',
      expiry_date: initialData?.expiry_date || '',
      customer_name: initialData?.customer_name || '',
      customer_address: initialData?.customer_address || '',
      dob: initialData?.dob || '',
      mobile_no: initialData?.mobile_no || '',
      aadhar_no: initialData?.aadhar_no || '',
      reference: initialData?.reference || '',
      reference_mobile_no: initialData?.reference_mobile_no || '',
      fee: initialData?.fee || 0,
      agent_fee: initialData?.agent_fee || 0,
      customer_payment: initialData?.customer_payment || 0,
      work_process: initialData?.work_process || '',
      approved: initialData?.approved || false,
      faceless_type: initialData?.faceless_type || 'non-faceless',
    },
  });

  // Watch financial fields for profit calculation
  const fee = watch('fee') || 0;
  const agentFee = watch('agent_fee') || 0;
  const customerPayment = watch('customer_payment') || 0;
  const profit = fee - agentFee - customerPayment;

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const totalDocs = existingDocs.length + newDocs.length + files.length;
    if (totalDocs > 3) {
      toast.error('Maximum 3 documents allowed');
      e.target.value = '';
      return;
    }

    // Add files with default labels
    const newDocuments: NewDocument[] = Array.from(files).map((file, index) => ({
      file,
      label: `DOCUMENT ${existingDocs.length + newDocs.length + index + 1}`,
    }));

    setNewDocs((prev) => [...prev, ...newDocuments]);
    e.target.value = ''; // Reset input
  };

  const updateDocLabel = (index: number, label: string) => {
    setNewDocs((prev) =>
      prev.map((doc, i) => (i === index ? { ...doc, label: label.toUpperCase() } : doc))
    );
  };

  const removeNewDoc = (index: number) => {
    setNewDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingDoc = (fileId: string) => {
    setExistingDocs((prev) => prev.filter((doc) => doc.file_id !== fileId));
  };

  // Auto-uppercase handler for text inputs
  const handleUppercaseBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    fieldName: keyof LicenseFormData
  ) => {
    const value = e.target.value.toUpperCase();
    setValue(fieldName, value as never);
  };

  // Mobile number validation - only digits, max 10
  const handleMobileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: 'mobile_no' | 'reference_mobile_no'
  ) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setValue(fieldName, value);
  };

  // Aadhar validation - only digits, max 12
  const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
    setValue('aadhar_no', value);
  };

  const onFormSubmit = async (data: LicenseFormData) => {
    try {
      setIsSubmitting(true);

      const submitData: LicenseFormData = {
        ...data,
        // Convert all text fields to uppercase
        lic_no: data.lic_no?.toUpperCase() || '',
        application_no: data.application_no?.toUpperCase(),
        customer_name: data.customer_name?.toUpperCase(),
        customer_address: data.customer_address?.toUpperCase(),
        reference: data.reference?.toUpperCase(),
        work_process: data.work_process?.toUpperCase(),
        documents: newDocs,
        existing_documents: existingDocs,
      };

      await onSubmit(submitData);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to save license');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDocs = existingDocs.length + newDocs.length;
  const canAddMoreDocs = totalDocs < 3;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* License Details */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <DocumentIcon className="w-5 h-5 text-primary" />
            License Details
          </h2>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="License No *"
              placeholder="Enter license number"
              error={errors.lic_no?.message}
              className="uppercase"
              {...register('lic_no', {
                required: 'License number is required',
              })}
              onBlur={(e) => handleUppercaseBlur(e, 'lic_no')}
            />

            <Input
              label="Application No"
              placeholder="Enter application number"
              className="uppercase"
              {...register('application_no')}
              onBlur={(e) => handleUppercaseBlur(e, 'application_no')}
            />

            <Controller
              name="expiry_date"
              control={control}
              rules={{ required: 'Expiry date is required' }}
              render={({ field }) => (
                <SingleDatePicker
                  label="Expiry Date *"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => field.onChange(date?.toISOString() || '')}
                  error={errors.expiry_date?.message}
                  placeholder="Select expiry date"
                />
              )}
            />

            <Controller
              name="faceless_type"
              control={control}
              render={({ field }) => (
                <Select
                  label="Type"
                  options={FACELESS_OPTIONS}
                  value={field.value || 'non-faceless'}
                  onChange={field.onChange}
                />
              )}
            />

            <div className="md:col-span-2">
              <Input
                label="Work Process"
                placeholder="Enter work process details"
                className="uppercase"
                {...register('work_process')}
                onBlur={(e) => handleUppercaseBlur(e, 'work_process')}
              />
            </div>

            <Controller
              name="approved"
              control={control}
              render={({ field }) => (
                <Select
                  label="Approved"
                  options={APPROVED_OPTIONS}
                  value={String(field.value || false)}
                  onChange={(val: string) => field.onChange(val === 'true')}
                />
              )}
            />
          </div>
        </Card.Body>
      </Card>

      {/* Customer Details */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-primary" />
            Customer Details
          </h2>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Customer Name"
              placeholder="Enter customer name"
              className="uppercase"
              {...register('customer_name')}
              onBlur={(e) => handleUppercaseBlur(e, 'customer_name')}
            />

            <Controller
              name="dob"
              control={control}
              render={({ field }) => (
                <SingleDatePicker
                  label="Date of Birth"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => field.onChange(date?.toISOString() || '')}
                  placeholder="Select date of birth"
                  maxDate={new Date()}
                />
              )}
            />

            <Input
              label="Mobile No"
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
              {...register('mobile_no', {
                pattern: {
                  value: /^$|^[6-9]\d{9}$/,
                  message: 'Invalid mobile number',
                },
              })}
              onChange={(e) => handleMobileChange(e, 'mobile_no')}
              error={errors.mobile_no?.message}
            />

            <Input
              label="Aadhar No"
              placeholder="Enter 12-digit Aadhar number"
              maxLength={12}
              {...register('aadhar_no', {
                pattern: {
                  value: /^$|^\d{12}$/,
                  message: 'Aadhar must be 12 digits',
                },
              })}
              onChange={handleAadharChange}
              error={errors.aadhar_no?.message}
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Address
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase"
                rows={3}
                placeholder="Enter complete address"
                {...register('customer_address')}
                onBlur={(e) => handleUppercaseBlur(e, 'customer_address')}
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Reference Details */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <PhoneIcon className="w-5 h-5 text-primary" />
            Reference Details
          </h2>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Reference Name"
              placeholder="Enter reference name"
              className="uppercase"
              {...register('reference')}
              onBlur={(e) => handleUppercaseBlur(e, 'reference')}
            />

            <Input
              label="Reference Mobile No"
              placeholder="Enter 10-digit mobile"
              maxLength={10}
              {...register('reference_mobile_no', {
                pattern: {
                  value: /^$|^[6-9]\d{9}$/,
                  message: 'Invalid mobile number',
                },
              })}
              onChange={(e) => handleMobileChange(e, 'reference_mobile_no')}
              error={errors.reference_mobile_no?.message}
            />
          </div>
        </Card.Body>
      </Card>

      {/* Financial Details */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CurrencyRupeeIcon className="w-5 h-5 text-primary" />
            Financial Details
          </h2>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="number"
              label="Fee"
              placeholder="0"
              {...register('fee', {
                valueAsNumber: true,
                min: { value: 0, message: 'Fee must be positive' },
              })}
              error={errors.fee?.message}
            />

            <Input
              type="number"
              label="Agent Fee"
              placeholder="0"
              {...register('agent_fee', {
                valueAsNumber: true,
                min: { value: 0, message: 'Agent fee must be positive' },
              })}
              error={errors.agent_fee?.message}
            />

            <Input
              type="number"
              label="Customer Payment"
              placeholder="0"
              {...register('customer_payment', {
                valueAsNumber: true,
                min: { value: 0, message: 'Payment must be positive' },
              })}
              error={errors.customer_payment?.message}
            />
          </div>

          {/* Profit Display */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Calculated Profit:</span>
              <span
                className={`text-xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                ₹{profit.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Profit = Fee - Agent Fee - Customer Payment
            </p>
          </div>
        </Card.Body>
      </Card>

      {/* Documents */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <DocumentIcon className="w-5 h-5 text-primary" />
            Documents ({totalDocs}/3)
          </h2>
        </Card.Header>
        <Card.Body>
          {/* Existing Documents */}
          {existingDocs.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Existing Documents</p>
              <div className="space-y-2">
                {existingDocs.map((doc) => (
                  <div
                    key={doc.file_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <DocumentIcon className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{doc.label || doc.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {doc.original_name || doc.file_name}
                        </p>
                      </div>
                      <a
                        href={doc.web_view_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingDoc(doc.file_id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded ml-2"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Documents with Labels */}
          {newDocs.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">New Documents</p>
              <div className="space-y-2">
                {newDocs.map((doc, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <DocumentIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={doc.label}
                        onChange={(e) => updateDocLabel(index, e.target.value)}
                        placeholder="Document label"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-primary uppercase"
                      />
                      <p className="text-xs text-gray-500 mt-1 truncate">{doc.file.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewDoc(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded flex-shrink-0"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Area */}
          {canAddMoreDocs ? (
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                <CloudArrowUpIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">
                  <span className="text-primary font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, JPG, PNG (max 10MB each) - {3 - totalDocs} remaining
                </p>
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              Maximum 3 documents reached. Remove existing documents to add new ones.
            </p>
          )}
        </Card.Body>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="secondary" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEdit ? 'Update License' : 'Create License'}
        </Button>
      </div>
    </form>
  );
}
