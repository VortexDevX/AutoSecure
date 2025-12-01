'use client';

import { Input } from '@/components/ui/Input';
import { SingleDatePicker } from '@/components/ui/DatePicker';
import { usePolicyForm } from '@/lib/context/PolicyFormContext';
import { usePolicyFormMeta } from '@/lib/hooks/useMeta';
import { useState } from 'react';
import {
  CloudArrowUpIcon,
  UserGroupIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export function Step2CustomerDetails() {
  const { formData, updateFormData } = usePolicyForm();
  const { branches, executiveNames, nomineeRelations, isLoading } = usePolicyFormMeta();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (field: 'adh_file' | 'pan_file', file: File | null) => {
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({ ...prev, [field]: 'Only PDF, JPG, and PNG files are allowed' }));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, [field]: 'File must be less than 10MB' }));
        return;
      }
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }

    // Clear the delete flag if uploading new file
    if (field === 'adh_file') {
      updateFormData({ adh_file: file || undefined, adh_file_delete: false });
    } else {
      updateFormData({ pan_file: file || undefined, pan_file_delete: false });
    }
  };

  const handleRemoveFile = (field: 'adh_file' | 'pan_file') => {
    if (field === 'adh_file') {
      updateFormData({
        adh_file: undefined,
        adh_file_delete: true,
        existing_adh_file: null,
      });
    } else {
      updateFormData({
        pan_file: undefined,
        pan_file_delete: true,
        existing_pan_file: null,
      });
    }
  };

  // Check if there's an existing file (from editing) or a new file selected
  const hasAdhFile =
    formData.adh_file instanceof File || (formData.existing_adh_file && !formData.adh_file_delete);
  const hasPanFile =
    formData.pan_file instanceof File || (formData.existing_pan_file && !formData.pan_file_delete);

  return (
    <div className="space-y-8">
      {/* Customer Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label label-required">Branch</label>
            <select
              value={formData.branch_id || ''}
              onChange={(e) => updateFormData({ branch_id: e.target.value })}
              className="input"
              disabled={isLoading}
            >
              <option value="">{isLoading ? 'Loading...' : 'Select branch'}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.value}>
                  {branch.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label label-required">Executive Name</label>
            <select
              value={formData.exicutive_name || ''}
              onChange={(e) => updateFormData({ exicutive_name: e.target.value })}
              className="input"
              disabled={isLoading}
            >
              <option value="">{isLoading ? 'Loading...' : 'Select executive'}</option>
              {executiveNames.map((exec) => (
                <option key={exec.id} value={exec.value}>
                  {exec.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Customer Name"
            type="text"
            placeholder="Full name"
            value={formData.customer || ''}
            onChange={(e) => updateFormData({ customer: e.target.value })}
            required
          />

          <Input
            label="Aadhaar Number"
            type="text"
            placeholder="12-digit Aadhaar (optional)"
            maxLength={12}
            value={formData.adh_id || ''}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              updateFormData({ adh_id: value });
            }}
          />

          <Input
            label="PAN Number"
            type="text"
            placeholder="ABCDE1234F (optional)"
            maxLength={10}
            value={formData.pan_no || ''}
            onChange={(e) => updateFormData({ pan_no: e.target.value.toUpperCase() })}
          />

          <Input
            label="Mobile Number"
            type="tel"
            placeholder="10-digit mobile (optional)"
            maxLength={10}
            value={formData.mobile_no || ''}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              updateFormData({ mobile_no: value });
            }}
          />

          <Input
            label="Alternate Mobile Number"
            type="tel"
            placeholder="10-digit mobile (optional)"
            maxLength={10}
            value={formData.mobile_no_two || ''}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              updateFormData({ mobile_no_two: value });
            }}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="customer@example.com (optional)"
            value={formData.email || ''}
            onChange={(e) => updateFormData({ email: e.target.value })}
          />

          <Input
            label="City"
            type="text"
            placeholder="e.g., Ahmedabad, Surat (optional)"
            value={formData.city_id || ''}
            onChange={(e) => updateFormData({ city_id: e.target.value })}
          />

          <div className="md:col-span-2">
            <Input
              label="Address"
              type="text"
              placeholder="Full address (optional)"
              value={formData.address_1 || ''}
              onChange={(e) => updateFormData({ address_1: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Nominee Details Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <UserGroupIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900">Nominee Details (Optional)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="Nominee Name"
            type="text"
            placeholder="Full name of nominee"
            value={formData.nominee_name || ''}
            onChange={(e) => updateFormData({ nominee_name: e.target.value })}
          />

          <SingleDatePicker
            label="Nominee Date of Birth"
            value={formData.nominee_dob ? new Date(formData.nominee_dob) : null}
            onChange={(date) =>
              updateFormData({ nominee_dob: date ? date.toISOString().split('T')[0] : '' })
            }
            placeholder="Select date of birth"
            maxDate={new Date()}
            minYear={1920}
          />

          <div>
            <label className="label">Nominee Relation</label>
            <select
              value={formData.nominee_relation || ''}
              onChange={(e) => updateFormData({ nominee_relation: e.target.value })}
              className="input"
              disabled={isLoading}
            >
              <option value="">{isLoading ? 'Loading...' : 'Select relation'}</option>
              {nomineeRelations.map((relation) => (
                <option key={relation.id} value={relation.value}>
                  {relation.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>💡 Note:</strong> Nominee details are optional. Add nominee information if the
            policy requires a beneficiary.
          </p>
        </div>
      </div>

      {/* Document Uploads */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Uploads (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Aadhaar Upload */}
          <div>
            <label className="label">Aadhaar Document</label>
            <div className="mt-1">
              {hasAdhFile ? (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {formData.adh_file instanceof File
                          ? formData.adh_file.name
                          : formData.existing_adh_file?.file_name || 'Aadhaar Document'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formData.adh_file instanceof File
                          ? `${(formData.adh_file.size / 1024 / 1024).toFixed(2)} MB - New upload`
                          : 'Already uploaded'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile('adh_file')}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <XMarkIcon className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-primary focus:outline-none">
                  <div className="flex flex-col items-center space-y-2">
                    <CloudArrowUpIcon className="w-10 h-10 text-gray-400" />
                    <span className="text-sm text-gray-600">Click to upload Aadhaar</span>
                    <span className="text-xs text-gray-500">PDF, JPG, PNG (max 10MB)</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('adh_file', e.target.files?.[0] || null)}
                  />
                </label>
              )}
              {errors.adh_file && <p className="text-xs text-red-500 mt-1">{errors.adh_file}</p>}
            </div>
          </div>

          {/* PAN Upload */}
          <div>
            <label className="label">PAN Document</label>
            <div className="mt-1">
              {hasPanFile ? (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {formData.pan_file instanceof File
                          ? formData.pan_file.name
                          : formData.existing_pan_file?.file_name || 'PAN Document'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formData.pan_file instanceof File
                          ? `${(formData.pan_file.size / 1024 / 1024).toFixed(2)} MB - New upload`
                          : 'Already uploaded'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile('pan_file')}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <XMarkIcon className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-primary focus:outline-none">
                  <div className="flex flex-col items-center space-y-2">
                    <CloudArrowUpIcon className="w-10 h-10 text-gray-400" />
                    <span className="text-sm text-gray-600">Click to upload PAN</span>
                    <span className="text-xs text-gray-500">PDF, JPG, PNG (max 10MB)</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('pan_file', e.target.files?.[0] || null)}
                  />
                </label>
              )}
              {errors.pan_file && <p className="text-xs text-red-500 mt-1">{errors.pan_file}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
