'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Policy, PolicyAttachment } from '@/lib/types/policy';
import { getRecipientEmail, sendBackupEmail } from '@/lib/api/emails';
import {
  EnvelopeIcon,
  PaperClipIcon,
  DocumentIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: Policy | null;
  onSuccess?: () => void;
  isLoading?: boolean;
}

export function SendEmailModal({
  isOpen,
  onClose,
  policy,
  onSuccess,
  isLoading = false,
}: SendEmailModalProps) {
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [isLoadingRecipient, setIsLoadingRecipient] = useState(true);
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [fileError, setFileError] = useState('');

  const availableAttachments: PolicyAttachment[] = useMemo(() => {
    if (!policy) return [];

    const attachments: PolicyAttachment[] = [];

    if (policy.adh_file) {
      attachments.push({
        id: 'adh_file',
        label: 'Aadhaar Document',
        fileName: policy.adh_file.file_name,
        available: true,
      });
    }

    if (policy.pan_file) {
      attachments.push({
        id: 'pan_file',
        label: 'PAN Document',
        fileName: policy.pan_file.file_name,
        available: true,
      });
    }

    policy.other_documents?.forEach((doc, index) => {
      attachments.push({
        id: `other_doc_${index}`,
        label: doc.label,
        fileName: doc.file_name,
        available: true,
      });
    });

    return attachments;
  }, [policy]);

  useEffect(() => {
    if (!isOpen) return;
    setNewAttachments([]);
    setFileError('');
    setSelectedAttachments([]);
    fetchRecipientEmail();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !policy) return;

    const preSelected: string[] = [];
    if (policy.adh_file) preSelected.push('adh_file');
    if (policy.pan_file) preSelected.push('pan_file');
    policy.other_documents?.forEach((_, index) => {
      preSelected.push(`other_doc_${index}`);
    });
    setSelectedAttachments(preSelected);
  }, [isOpen, policy]);

  const fetchRecipientEmail = async () => {
    setIsLoadingRecipient(true);
    try {
      const email = await getRecipientEmail();
      setRecipientEmail(email);
    } catch {
      setRecipientEmail('Not configured');
    } finally {
      setIsLoadingRecipient(false);
    }
  };

  const toggleAttachment = (id: string) => {
    setSelectedAttachments((prev) =>
      prev.includes(id) ? prev.filter((attachment) => attachment !== id) : [...prev, id]
    );
  };

  const handleAddNewAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024;
    const nextFiles: File[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];

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

      nextFiles.push(file);
    }

    if (newAttachments.length + nextFiles.length > 5) {
      setFileError('Maximum 5 new attachments allowed');
      e.target.value = '';
      return;
    }

    setFileError('');
    setNewAttachments((prev) => [...prev, ...nextFiles]);
    e.target.value = '';
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    setFileError('');
  };

  const handleSend = async () => {
    if (!policy) return;

    setIsSending(true);
    try {
      await sendBackupEmail(policy._id, selectedAttachments, newAttachments);
      toast.success('Email sent successfully');
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
    setNewAttachments([]);
    setSelectedAttachments([]);
    setFileError('');
    onClose();
  };

  const totalAttachments = selectedAttachments.length + newAttachments.length;
  const hasPolicy = Boolean(policy);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Send Policy Email"
      size="lg"
      description="Review the recipient, attachments, and summary before sending."
    >
      <div className="space-y-5">
        <div>
          <label className="label">Recipient Email</label>
          <div className="flex items-center gap-2 rounded-[16px] border border-slate-200 bg-slate-50/90 px-3.5 py-3">
            <EnvelopeIcon className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-800">
              {isLoadingRecipient ? 'Loading...' : recipientEmail}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            This is the configured backup email address and cannot be changed here.
          </p>
        </div>

        {isLoading && !policy ? (
          <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 px-4 py-5 text-sm text-slate-500">
            Loading policy details before preparing the email.
          </div>
        ) : !hasPolicy ? (
          <div className="rounded-[18px] border border-amber-200 bg-amber-50/80 px-4 py-5 text-sm text-amber-800">
            Policy details are not available yet. Close this modal and reopen once the record loads.
          </div>
        ) : (
          <>
            <div className="rounded-[18px] border border-sky-200 bg-sky-50/70 p-4">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-600" />
                <div>
                  <p className="text-sm font-medium text-sky-900">Policy summary included</p>
                  <p className="mt-1 text-sm text-sky-800">
                    A summary of policy <strong>{policy?.policy_no}</strong> for customer{' '}
                    <strong>{policy?.customer}</strong> will be included in the email body.
                  </p>
                </div>
              </div>
            </div>

            {availableAttachments.length > 0 && (
              <div>
                <label className="label">
                  <PaperClipIcon className="mr-1 inline h-4 w-4" />
                  Select Attachments From Policy
                </label>
                <div className="mt-2 space-y-2">
                  {availableAttachments.map((attachment) => {
                    const isSelected = selectedAttachments.includes(attachment.id);
                    return (
                      <label
                        key={attachment.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-[16px] border px-3 py-3 transition ${
                          isSelected
                            ? 'border-primary/25 bg-primary/8'
                            : 'border-slate-200 bg-slate-50/80 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded ${
                            isSelected
                              ? 'bg-primary text-white'
                              : 'border border-slate-300 bg-white text-transparent'
                          }`}
                        >
                          <CheckIcon className="h-3.5 w-3.5" />
                        </div>
                        <DocumentIcon className="h-5 w-5 flex-shrink-0 text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900">{attachment.label}</p>
                          <p className="truncate text-xs text-slate-500">{attachment.fileName}</p>
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

            <div>
              <label className="label">Upload New Attachments ({newAttachments.length}/5)</label>
              <div className="mt-2">
                <label
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-[16px] border-2 border-dashed px-4 py-4 transition ${
                    newAttachments.length >= 5
                      ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                      : 'border-slate-300 bg-slate-50/80 text-slate-600 hover:border-primary/35 hover:bg-white'
                  }`}
                >
                  <PlusIcon className="h-5 w-5" />
                  <span className="text-sm">
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
                {fileError && <p className="mt-2 text-sm text-rose-600">{fileError}</p>}
              </div>

              {newAttachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {newAttachments.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-[16px] border border-emerald-200 bg-emerald-50/70 px-3 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <DocumentIcon className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
                          <p className="text-xs text-slate-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • New
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewAttachment(index)}
                        className="rounded-full p-1 transition hover:bg-emerald-100"
                      >
                        <XMarkIcon className="h-4 w-4 text-slate-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              Total attachments: <strong className="text-slate-900">{totalAttachments}</strong>
            </span>
            {totalAttachments === 0 && hasPolicy && (
              <span className="text-amber-700">No attachments selected</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={handleClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSend}
            isLoading={isSending}
            disabled={isSending || !hasPolicy}
          >
            <EnvelopeIcon className="mr-2 h-4 w-4" />
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
