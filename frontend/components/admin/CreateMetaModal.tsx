'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createMetaOption, getMetaByCategory } from '@/lib/api/meta';
import { MetaOption } from '@/lib/types/meta';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface CreateMetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  onSuccess: () => void;
  existingOptions: MetaOption[];
}

// Categories that support parent values
const DEPENDENT_CATEGORIES: Record<string, string> = {
  manufacturer: 'vehicle_product', // manufacturer depends on vehicle_product
};

export function CreateMetaModal({
  isOpen,
  onClose,
  category,
  onSuccess,
  existingOptions,
}: CreateMetaModalProps) {
  const [value, setValue] = useState('');
  const [label, setLabel] = useState('');
  const [parentValue, setParentValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if this category has a parent
  const parentCategory = DEPENDENT_CATEGORIES[category];

  // Fetch parent options if this is a dependent category
  const { data: parentOptions } = useSWR(
    isOpen && parentCategory ? `/api/v1/meta/${parentCategory}` : null,
    () => getMetaByCategory(parentCategory!)
  );

  // Auto-generate value from label
  useEffect(() => {
    if (label && !value) {
      const autoValue = label
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      setValue(autoValue);
    }
  }, [label]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!value.trim() || !label.trim()) {
      toast.error('Value and label are required');
      return;
    }

    // Check for duplicate value
    const isDuplicate = existingOptions.some(
      (opt) => String(opt.value).toLowerCase() === value.trim().toLowerCase()
    );
    if (isDuplicate) {
      toast.error('An option with this value already exists');
      return;
    }

    setIsSubmitting(true);
    try {
      await createMetaOption({
        category,
        value: value.trim().toLowerCase(),
        label: label.trim(),
        parent_value: parentValue.trim() || undefined,
      });

      toast.success('Option created successfully');
      handleClose();
      onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create option');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setValue('');
    setLabel('');
    setParentValue('');
    onClose();
  };

  const getCategoryDisplayName = (cat: string): string => {
    return cat
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Option">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category Info */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Adding option to:{' '}
            <span className="font-semibold text-gray-900">{getCategoryDisplayName(category)}</span>
          </p>
          <code className="text-xs text-gray-500">{category}</code>
        </div>

        {/* Label Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Display Label <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Maruti Suzuki, HDFC Bank"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            required
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">This is what users will see in dropdowns</p>
        </div>

        {/* Value Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Technical Value <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            placeholder="e.g., maruti_suzuki, hdfc_bank"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Unique identifier used in the database (auto-generated from label)
          </p>
        </div>

        {/* Parent Value (for dependent categories) */}
        {parentCategory && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Parent ({getCategoryDisplayName(parentCategory)})
            </label>
            <select
              value={parentValue}
              onChange={(e) => setParentValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">-- Select Parent (Optional) --</option>
              {parentOptions?.map((opt) => (
                <option key={String(opt.id)} value={String(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              This option will only show when the parent is selected
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Tips:</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-700">
              <li>Keep values lowercase with underscores</li>
              <li>Labels can have proper casing and spaces</li>
              <li>Values must be unique within the category</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting || !value.trim() || !label.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Create Option'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
