'use client';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { usePolicyForm } from '@/lib/context/PolicyFormContext';
import { usePolicyFormMeta } from '@/lib/hooks/useMeta';
import { useState } from 'react';
import {
  DocumentIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { SingleDatePicker } from '@/components/ui/DatePicker';

export function Step4PremiumDetails() {
  const { formData, updateFormData } = usePolicyForm();
  const { ncbOptions, addonCoverageOptions, isLoading } = usePolicyFormMeta();

  // Other Documents State
  const [docLabel, setDocLabel] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docError, setDocError] = useState('');

  // ✅ Previous Policy Toggle State
  const [showPreviousPolicy, setShowPreviousPolicy] = useState(
    formData.has_previous_policy ||
      !!(
        formData.previous_policy_no ||
        formData.previous_policy_company ||
        formData.previous_policy_ncb
      )
  );

  // Handle checkbox toggle for add-on coverage
  const handleAddonToggle = (value: string) => {
    const current = formData.addon_coverage || [];
    if (current.includes(value)) {
      updateFormData({ addon_coverage: current.filter((v) => v !== value) });
    } else {
      updateFormData({ addon_coverage: [...current, value] });
    }
  };

  // ✅ Handle Previous Policy Toggle
  const handlePreviousPolicyToggle = (hasPrevious: boolean) => {
    setShowPreviousPolicy(hasPrevious);
    updateFormData({ has_previous_policy: hasPrevious });

    // Clear previous policy fields if toggled off
    if (!hasPrevious) {
      updateFormData({
        previous_policy_no: undefined,
        previous_policy_company: undefined,
        previous_policy_expiry_date: undefined,
        previous_policy_ncb: undefined,
        previous_policy_claim: undefined,
      });
    }
  };

  const handleAddDocument = () => {
    if (!docLabel.trim()) {
      setDocError('Please enter document label');
      return;
    }
    if (!docFile) {
      setDocError('Please select a file');
      return;
    }

    const current = formData.other_documents || [];

    if (current.length >= 5) {
      setDocError('Maximum 5 documents allowed');
      return;
    }

    updateFormData({
      other_documents: [...current, { file: docFile, label: docLabel.trim() }],
    });

    setDocLabel('');
    setDocFile(null);
    setDocError('');
  };

  const handleRemoveDocument = (index: number) => {
    const current = formData.other_documents || [];
    updateFormData({
      other_documents: current.filter((_, i) => i !== index),
    });
  };

  const handleDocFileChange = (file: File | null) => {
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setDocError('Only PDF, JPG, and PNG files are allowed');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setDocError('File must be less than 10MB');
        return;
      }
      setDocError('');
    }
    setDocFile(file);
  };

  return (
    <div className="space-y-8">
      {/* Premium Details */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Premium Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Sum Insured"
            type="number"
            placeholder="0"
            value={formData.sum_insured || ''}
            onChange={(e) =>
              updateFormData({ sum_insured: parseFloat(e.target.value) || undefined })
            }
          />

          <Input
            label="CNG Value"
            type="number"
            placeholder="0"
            value={formData.cng_value || ''}
            onChange={(e) => updateFormData({ cng_value: parseFloat(e.target.value) || undefined })}
          />

          {/* ✅ RENAMED: OD Premium (was Discounted Value) */}
          <Input
            label="OD Premium"
            type="number"
            placeholder="0"
            value={formData.od_premium || ''}
            onChange={(e) =>
              updateFormData({ od_premium: parseFloat(e.target.value) || undefined })
            }
          />

          <div>
            <label className="label">NCB (No Claim Bonus)</label>
            <select
              value={formData.ncb || ''}
              onChange={(e) => updateFormData({ ncb: e.target.value })}
              className="input"
              disabled={isLoading}
            >
              <option value="">{isLoading ? 'Loading...' : 'Select NCB'}</option>
              {ncbOptions.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Net Premium"
            type="number"
            placeholder="0"
            value={formData.net_premium || ''}
            onChange={(e) =>
              updateFormData({ net_premium: parseFloat(e.target.value) || undefined })
            }
          />

          {/* ✅ RENAMED: Total Premium with GST (was On Date Premium) */}
          <Input
            label="Total Premium with GST"
            type="number"
            placeholder="0"
            value={formData.total_premium_gst || ''}
            onChange={(e) =>
              updateFormData({ total_premium_gst: parseFloat(e.target.value) || undefined })
            }
          />

          <Input
            label="Agent Commission Amount"
            type="number"
            placeholder="Enter commission amount"
            value={formData.agent_commission || ''}
            onChange={(e) =>
              updateFormData({ agent_commission: parseFloat(e.target.value) || undefined })
            }
          />

          <SingleDatePicker
            label="Date"
            value={formData.date ? new Date(formData.date) : null}
            onChange={(date) =>
              updateFormData({ date: date ? date.toISOString().split('T')[0] : '' })
            }
            placeholder="Date"
          />

          <div className="md:col-span-2">
            <Input
              label="Other Remarks"
              type="text"
              placeholder="Additional notes (optional)"
              value={formData.other_remark || ''}
              onChange={(e) => updateFormData({ other_remark: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Add-on Coverage Checkbox Grid */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add-on Coverage (Optional)</h3>

        {isLoading ? (
          <div className="text-gray-500">Loading add-on options...</div>
        ) : addonCoverageOptions.length === 0 ? (
          <div className="text-gray-500">
            No add-on coverage options available. Add them in Meta Management.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {addonCoverageOptions.map((addon) => {
              const isSelected = formData.addon_coverage?.includes(addon.value) || false;
              return (
                <label
                  key={String(addon.id)}
                  className={`
                    relative flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div
                    className={`
                      w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors
                      ${isSelected ? 'bg-primary text-white' : 'border-2 border-gray-300 bg-white'}
                    `}
                  >
                    {isSelected && <CheckIcon className="w-3.5 h-3.5" />}
                  </div>
                  <span
                    className={`text-sm ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}
                  >
                    {addon.label}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isSelected}
                    onChange={() => handleAddonToggle(addon.value)}
                  />
                </label>
              );
            })}
          </div>
        )}

        {/* Selected count */}
        {formData.addon_coverage && formData.addon_coverage.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-medium text-primary">{formData.addon_coverage.length}</span>{' '}
            add-on(s) selected
          </div>
        )}
      </div>

      {/* ✅ UPDATED: Previous Policy Details with Toggle */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Previous Policy Details</h3>
        </div>

        {/* Toggle Question */}
        <div className="mb-6">
          <label className="label">Do you have a previous policy?</label>
          <div className="flex items-center gap-6 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="has_previous_policy"
                value="yes"
                checked={showPreviousPolicy === true}
                onChange={() => handlePreviousPolicyToggle(true)}
                className="w-4 h-4 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="has_previous_policy"
                value="no"
                checked={showPreviousPolicy === false}
                onChange={() => handlePreviousPolicyToggle(false)}
                className="w-4 h-4 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        {/* Collapsible Previous Policy Section */}
        {showPreviousPolicy && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Previous Policy Number"
                type="text"
                placeholder="e.g., POL-2024-001"
                value={formData.previous_policy_no || ''}
                onChange={(e) => updateFormData({ previous_policy_no: e.target.value })}
              />

              <Input
                label="Previous Policy Company"
                type="text"
                placeholder="e.g., HDFC ERGO, ICICI Lombard"
                value={formData.previous_policy_company || ''}
                onChange={(e) => updateFormData({ previous_policy_company: e.target.value })}
              />

              <SingleDatePicker
                label="Previous Policy Expiry Date"
                value={
                  formData.previous_policy_expiry_date
                    ? new Date(formData.previous_policy_expiry_date)
                    : null
                }
                onChange={(date) =>
                  updateFormData({
                    previous_policy_expiry_date: date ? date.toISOString().split('T')[0] : '',
                  })
                }
                placeholder="Previous Policy Expiry Date"
              />

              <div>
                <label className="label">Previous Policy NCB</label>
                <select
                  value={formData.previous_policy_ncb || ''}
                  onChange={(e) => updateFormData({ previous_policy_ncb: e.target.value })}
                  className="input"
                  disabled={isLoading}
                >
                  <option value="">{isLoading ? 'Loading...' : 'Select Previous NCB'}</option>
                  {ncbOptions.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Claim Radio Buttons */}
              <div className="md:col-span-2">
                <label className="label">Did you make any claim in your previous policy?</label>
                <div className="flex items-center gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="previous_policy_claim"
                      value="yes"
                      checked={formData.previous_policy_claim === 'yes'}
                      onChange={() => updateFormData({ previous_policy_claim: 'yes' })}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="previous_policy_claim"
                      value="no"
                      checked={formData.previous_policy_claim === 'no'}
                      onChange={() => updateFormData({ previous_policy_claim: 'no' })}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Other Documents Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Other Documents (Optional)</h3>
          <span className="text-sm text-gray-500">
            {formData.other_documents?.length || 0}/5 uploaded
          </span>
        </div>

        {/* Add Document Form */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Document Label"
              type="text"
              placeholder="e.g., RC Book, Fitness Certificate"
              value={docLabel}
              onChange={(e) => setDocLabel(e.target.value)}
            />

            <div>
              <label className="label">Select File</label>
              <label className="flex items-center justify-center w-full h-10 px-4 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <span className="text-sm text-gray-600 truncate">
                  {docFile ? docFile.name : 'Choose file'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleDocFileChange(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div className="flex items-end">
              <Button
                variant="secondary"
                size="md"
                onClick={handleAddDocument}
                disabled={(formData.other_documents?.length || 0) >= 5}
                className="w-full flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add Document
              </Button>
            </div>
          </div>
          {docError && <p className="text-sm text-danger mt-2">{docError}</p>}
        </div>

        {/* Document List */}
        {formData.other_documents && formData.other_documents.length > 0 ? (
          <div className="space-y-3">
            {formData.other_documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <DocumentIcon className="w-8 h-8 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{doc.label}</p>
                    <p className="text-sm text-gray-500">
                      {doc.file.name} ({(doc.file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDocument(index)}
                  className="text-danger hover:text-danger-600 flex-shrink-0"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <DocumentIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No additional documents added</p>
            <p className="text-gray-400 text-xs mt-1">
              You can add up to 5 documents (RC Book, Fitness Certificate, etc.)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
