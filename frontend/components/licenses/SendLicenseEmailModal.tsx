'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { LicenseRecord } from '@/lib/types/license';
import { getRecipientEmail, sendLicenseBackupEmail } from '@/lib/api/emails';
import {
  EnvelopeIcon,
  PaperClipIcon,
  DocumentIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface LicenseAttachment {
  id: string;
  label: string;
  fileName: string;
  available: boolean;
}

interface SendLicenseEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: LicenseRecord;
  onSuccess?: () => void;
}

export function SendLicenseEmailModal({
  isOpen,
  onClose,
  license,
  onSuccess,
}: SendLicenseEmailModalProps) {
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [isLoadingRecipient, setIsLoadingRecipient] = useState(true);
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [fileError, setFileError] = useState('');

  // Fetch recipient email and reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRecipientEmail();
      resetState();
    }
  }, [isOpen]);

  // Pre-select existing attachments when license changes
  useEffect(() => {
    if (isOpen && license) {
      const preSelected: string[] = [];
      license.documents?.forEach((_, index) => {
        preSelected.push(`doc_${index}`);
      });
      setSelectedAttachments(preSelected);
    }
  }, [isOpen, license]);

  const resetState = () => {
    setNewAttachments([]);
    setFileError('');
  };

  const fetchRecipientEmail = async () => {
    setIsLoadingRecipient(true);
    try {
      const email = await getRecipientEmail();
      setRecipientEmail(email);
    } catch (error) {
      setRecipientEmail('Not configured');
    } finally {
      setIsLoadingRecipient(false);
    }
  };

  // Build available attachments list from license documents
  const availableAttachments: LicenseAttachment[] = [];

  license.documents?.forEach((doc, index) => {
    availableAttachments.push({
      id: `doc_${index}`,
      label: doc.label || `Document ${index + 1}`,
      fileName: doc.file_name,
      available: true,
    });
  });

  const toggleAttachment = (id: string) => {
    setSelectedAttachments((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleAddNewAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const newFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!validTypes.includes(file.type)) {
        setFileError(`"${file.name}" is not allowed. Only PDF, JPG, and PNG files.`);
        e.target.value = '';
        return;
      }

      if (file.size > maxSize) {
        setFileError(`"${file.name}" is too large. Max 10MB per file.`);
        e.target.value = '';
        return;
      }

      newFiles.push(file);
    }

    if (newAttachments.length + newFiles.length > 5) {
      setFileError('Maximum 5 new attachments allowed');
      e.target.value = '';
      return;
    }

    setFileError('');
    setNewAttachments((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments((prev) => prev.filter((_, i) => i !== index));
    setFileError('');
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      await sendLicenseBackupEmail(license._id, selectedAttachments, newAttachments);
      toast.success('Email sent successfully!');
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to send email';
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    resetState();
    setSelectedAttachments([]);
    onClose();
  };

  const totalAttachments = selectedAttachments.length + newAttachments.length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send License Email" size="lg">
      <div className="space-y-6">
        {/* Recipient Email (Read-only) */}
        <div>
          <label className="label">Recipient Email</label>
          <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
            <EnvelopeIcon className="w-5 h-5 text-gray-500" />
            <span className="text-gray-900 font-medium">
              {isLoadingRecipient ? 'Loading...' : recipientEmail}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This is the configured backup email address and cannot be changed.
          </p>
        </div>

        {/* License Summary Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">License Summary Included</p>
              <p className="text-sm text-blue-800 mt-1">
                The email will include details for license <strong>{license.lic_no}</strong>
                {license.customer_name && (
                  <>
                    {' '}
                    for customer <strong>{license.customer_name}</strong>
                  </>
                )}
                :
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• License No: {license.lic_no}</li>
                <li>• Application No: {license.application_no || 'N/A'}</li>
                <li>
                  • Expiry Date:{' '}
                  {new Date(license.expiry_date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </li>
                <li>• Customer: {license.customer_name || 'N/A'}</li>
                <li>
                  • DOB:{' '}
                  {license.dob
                    ? new Date(license.dob).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </li>
                <li>• Mobile: {license.mobile_no || 'N/A'}</li>
                <li>• Aadhar: {license.aadhar_no || 'N/A'}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Existing Attachments */}
        {availableAttachments.length > 0 && (
          <div>
            <label className="label">
              <PaperClipIcon className="w-4 h-4 inline mr-1" />
              Select Documents to Attach
            </label>
            <div className="space-y-2 mt-2">
              {availableAttachments.map((attachment) => {
                const isSelected = selectedAttachments.includes(attachment.id);
                return (
                  <label
                    key={attachment.id}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div
                      className={`
                        w-5 h-5 rounded flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'bg-primary text-white' : 'border-2 border-gray-300'}
                      `}
                    >
                      {isSelected && <CheckIcon className="w-3.5 h-3.5" />}
                    </div>
                    <DocumentIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{attachment.label}</p>
                      <p className="text-xs text-gray-500 truncate">{attachment.fileName}</p>
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => toggleAttachment(attachment.id)}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Upload New Attachments */}
        <div>
          <label className="label">Upload Additional Documents ({newAttachments.length}/5)</label>
          <div className="mt-2">
            <label
              className={`
                flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                ${
                  newAttachments.length >= 5
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                }
              `}
            >
              <PlusIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">
                {newAttachments.length >= 5
                  ? 'Maximum files reached'
                  : 'Add files (PDF, JPG, PNG - max 10MB each)'}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                disabled={newAttachments.length >= 5}
                onChange={handleAddNewAttachment}
              />
            </label>
            {fileError && <p className="text-sm text-red-600 mt-2">{fileError}</p>}
          </div>

          {/* New Attachments List */}
          {newAttachments.length > 0 && (
            <div className="space-y-2 mt-3">
              {newAttachments.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <DocumentIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • New
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNewAttachment(index)}
                    className="p-1 hover:bg-green-100 rounded flex-shrink-0"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Total attachments: <strong className="text-gray-900">{totalAttachments}</strong>
            </span>
            {totalAttachments === 0 && (
              <span className="text-amber-600">No attachments selected</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={handleClose} disabled={isSending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSend} isLoading={isSending} disabled={isSending}>
            <EnvelopeIcon className="w-4 h-4 mr-2" />
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
