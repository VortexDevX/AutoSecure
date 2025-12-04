'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import {
  getLicenseById,
  deleteLicense,
  viewLicenseFile,
  downloadLicenseFile,
  deleteLicenseDocument,
} from '@/lib/api/licenses';
import { getLicenseEmailLogs } from '@/lib/api/emails';
import { LicenseRecord } from '@/lib/types/license';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { SendLicenseEmailModal } from '@/components/licenses/SendLicenseEmailModal';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  DocumentIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EnvelopeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function LicenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const licenseId = params.id as string;

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEmailLogsModal, setShowEmailLogsModal] = useState(false);

  // Document delete state
  const [showDeleteDocModal, setShowDeleteDocModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState<{ index: number; label: string } | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  // Use state for permissions to avoid hydration mismatch
  const [permissions, setPermissions] = useState({ canEdit: false, canDelete: false });

  // Calculate permissions after mount (client-side only)
  useEffect(() => {
    if (user) {
      const isOwnerOrAdmin = user.role === 'owner' || user.role === 'admin';
      setPermissions({
        canEdit: isOwnerOrAdmin,
        canDelete: isOwnerOrAdmin,
      });
    }
  }, [user]);

  // Fetch license details
  const {
    data: license,
    error,
    isLoading,
    mutate,
  } = useSWR<LicenseRecord>(`/api/v1/licenses/${licenseId}`, () => getLicenseById(licenseId));

  // Fetch email logs when modal is open
  const { data: emailLogs, mutate: mutateEmailLogs } = useSWR(
    showEmailLogsModal ? `/api/v1/emails/license-logs/${licenseId}` : null,
    () => getLicenseEmailLogs(licenseId)
  );

  const handleDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteLicense(licenseId);
      toast.success('License deleted successfully');
      router.push('/licenses');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || 'Failed to delete license');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleViewFile = async (fileId: string) => {
    try {
      setViewingFile(fileId);
      await viewLicenseFile(fileId);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to open file');
    } finally {
      setViewingFile(null);
    }
  };

  const handleDownloadFile = async (fileId: string, fileName: string, label: string) => {
    try {
      setDownloadingFile(fileId);
      const downloadName = `${label}_${fileName}`.replace(/\s+/g, '_');
      await downloadLicenseFile(fileId, downloadName);
      toast.success(`Downloaded ${label}`);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to download file');
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleDeleteDocClick = (index: number, label: string) => {
    setDocToDelete({ index, label });
    setShowDeleteDocModal(true);
  };

  const handleDeleteDocConfirm = async () => {
    if (!docToDelete) return;

    setIsDeletingDoc(true);
    try {
      await deleteLicenseDocument(licenseId, docToDelete.index);
      toast.success(`${docToDelete.label} deleted successfully`);
      mutate(); // Refresh license data
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || 'Failed to delete document');
    } finally {
      setIsDeletingDoc(false);
      setShowDeleteDocModal(false);
      setDocToDelete(null);
    }
  };

  // Show loading while auth is being checked
  if (isLoading || isAuthLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !license) {
    return (
      <div className="text-center py-20">
        <DocumentIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/licenses">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{license.lic_no}</h1>
            <p className="text-gray-600">{license.customer_name || 'No name'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Email Button - visible to all */}
          <Button variant="primary" onClick={() => setShowEmailModal(true)}>
            <EnvelopeIcon className="w-4 h-4 mr-2" />
            Send Email
          </Button>

          {/* Edit Button - Only for admin/owner */}
          {permissions.canEdit && (
            <Link href={`/licenses/${license._id}/edit`}>
              <Button variant="secondary">
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}

          {/* Delete Button - Only for admin/owner */}
          {permissions.canDelete && (
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant={license.approved ? 'success' : 'warning'}>
          {license.approved ? 'Approved' : 'Pending Approval'}
        </Badge>
        <Badge
          variant={
            license.faceless_type === 'faceless'
              ? 'info'
              : license.faceless_type === 'reminder'
                ? 'warning'
                : 'default'
          }
        >
          {license.faceless_type === 'faceless'
            ? 'Faceless'
            : license.faceless_type === 'reminder'
              ? 'Reminder'
              : 'Non-Faceless'}
        </Badge>
        {new Date(license.expiry_date) < new Date() && <Badge variant="danger">Expired</Badge>}
        {new Date(license.expiry_date) > new Date() &&
          new Date(license.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
            <Badge variant="warning">Expiring Soon</Badge>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* License Details */}
        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <DocumentIcon className="w-5 h-5 text-primary" />
              License Details
            </h2>
          </Card.Header>
          <Card.Body>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">License No</dt>
                <dd className="font-medium">{license.lic_no}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Application No</dt>
                <dd className="font-medium">{license.application_no || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Expiry Date</dt>
                <dd className="font-medium">{formatDate(license.expiry_date)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Work Process</dt>
                <dd className="font-medium">{license.work_process || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium capitalize">{license.faceless_type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Approved</dt>
                <dd>
                  {license.approved ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                  )}
                </dd>
              </div>
            </dl>
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
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium">{license.customer_name || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">DOB</dt>
                <dd className="font-medium">{license.dob ? formatDate(license.dob) : '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Mobile</dt>
                <dd className="font-medium">{license.mobile_no || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Aadhar No</dt>
                <dd className="font-medium">{license.aadhar_no || '-'}</dd>
              </div>
              {license.customer_address && (
                <div>
                  <dt className="text-gray-500 mb-1">Address</dt>
                  <dd className="font-medium text-sm">{license.customer_address}</dd>
                </div>
              )}
            </dl>
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
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Reference Name</dt>
                <dd className="font-medium">{license.reference || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Reference Mobile</dt>
                <dd className="font-medium">{license.reference_mobile_no || '-'}</dd>
              </div>
            </dl>
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
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Fee</dt>
                <dd className="font-medium">{formatCurrency(license.fee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Agent Fee</dt>
                <dd className="font-medium">{formatCurrency(license.agent_fee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Customer Payment</dt>
                <dd className="font-medium">{formatCurrency(license.customer_payment)}</dd>
              </div>
              <div className="flex justify-between border-t pt-3">
                <dt className="text-gray-700 font-semibold">Profit</dt>
                <dd
                  className={`font-bold ${(license.profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatCurrency(license.profit)}
                </dd>
              </div>
            </dl>
          </Card.Body>
        </Card>
      </div>

      {/* Documents */}
      {license.documents && license.documents.length > 0 && (
        <Card className="mt-6">
          <Card.Header>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <DocumentIcon className="w-5 h-5 text-primary" />
              Documents ({license.documents.length}/3)
            </h2>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {license.documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <DocumentIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.label || doc.file_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {doc.original_name || doc.file_name}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {/* View Button */}
                    <button
                      onClick={() => handleViewFile(doc.file_id)}
                      disabled={viewingFile === doc.file_id}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                      title="View file"
                    >
                      {viewingFile === doc.file_id ? (
                        <Spinner size="sm" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                    {/* Download Button */}
                    <button
                      onClick={() =>
                        handleDownloadFile(doc.file_id, doc.file_name, doc.label || 'Document')
                      }
                      disabled={downloadingFile === doc.file_id}
                      className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                      title="Download file"
                    >
                      {downloadingFile === doc.file_id ? (
                        <Spinner size="sm" />
                      ) : (
                        <DocumentArrowDownIcon className="w-5 h-5" />
                      )}
                    </button>
                    {/* Delete Button - Only for admin/owner */}
                    {permissions.canDelete && (
                      <button
                        onClick={() => handleDeleteDocClick(index, doc.label || doc.file_name)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete document"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="mt-6">
        <Card.Body>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setShowEmailModal(true)}>
              <EnvelopeIcon className="w-4 h-4 mr-2" />
              Send Backup Email
            </Button>
            <Button variant="ghost" onClick={() => setShowEmailLogsModal(true)}>
              <ClockIcon className="w-4 h-4 mr-2" />
              View Email History
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Metadata */}
      <Card className="mt-6">
        <Card.Body>
          <div className="flex flex-wrap gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span>Created: {formatDate(license.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span>Updated: {formatDate(license.updatedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span>
                Created by:{' '}
                {typeof license.created_by === 'object'
                  ? license.created_by?.full_name || license.created_by?.email
                  : 'Unknown'}
              </span>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Send Email Modal */}
      {license && (
        <SendLicenseEmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          license={license}
          onSuccess={() => mutateEmailLogs()}
        />
      )}

      {/* Delete License Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmText('');
        }}
        title="Delete License"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              Are you sure you want to delete license <strong>{license.lic_no}</strong>?
            </p>
          </div>
          <p className="text-sm text-gray-600">
            This action cannot be undone. All associated documents will be permanently deleted.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <strong className="text-red-600">DELETE</strong> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="DELETE"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
              disabled={deleteConfirmText !== 'DELETE' || isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete License'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Document Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteDocModal}
        onClose={() => {
          setShowDeleteDocModal(false);
          setDocToDelete(null);
        }}
        onConfirm={handleDeleteDocConfirm}
        title="Delete Document"
        message={`Are you sure you want to delete "${docToDelete?.label}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeletingDoc}
      />

      {/* Email Logs Modal */}
      <Modal
        isOpen={showEmailLogsModal}
        onClose={() => setShowEmailLogsModal(false)}
        title="Email History"
        size="lg"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {emailLogs && emailLogs.length > 0 ? (
            emailLogs.map((log: any) => (
              <div
                key={log._id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge
                    variant={
                      log.status === 'sent'
                        ? 'success'
                        : log.status === 'failed'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {log.sent_at ? formatDate(log.sent_at) : 'Pending'}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-700">
                    <span className="text-gray-500">To:</span> {log.sent_to}
                  </p>
                  <p className="text-gray-700">
                    <span className="text-gray-500">Subject:</span> {log.subject}
                  </p>
                  <p className="text-gray-700">
                    <span className="text-gray-500">Sent by:</span>{' '}
                    {log.sent_by?.email || 'Unknown'}
                  </p>
                </div>
                {log.error_message && (
                  <p className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded">
                    <strong>Error:</strong> {log.error_message}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <EnvelopeIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No emails sent yet</p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => {
                  setShowEmailLogsModal(false);
                  setShowEmailModal(true);
                }}
              >
                Send First Email
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
