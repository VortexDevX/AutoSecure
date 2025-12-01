'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr';
import {
  getPolicyById,
  deletePolicy,
  viewFile,
  downloadFile,
  deletePolicyFile,
} from '@/lib/api/policies';
import { getEmailLogs } from '@/lib/api/emails';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { SendEmailModal } from '@/components/policies/SendEmailModal';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  CalendarDaysIcon,
  UserIcon,
  TruckIcon,
  CurrencyRupeeIcon,
  CreditCardIcon,
  ClockIcon,
  ShieldCheckIcon,
  DocumentDuplicateIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

export default function PolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const policyId = params.id as string;

  // Role-based permissions
  const canEdit = user?.role === 'owner' || user?.role === 'admin';
  const canDelete = user?.role === 'owner' || user?.role === 'admin';
  const canDeleteDocuments = user?.role === 'owner' || user?.role === 'admin';

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEmailLogsModal, setShowEmailLogsModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // File operations
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{
    type: 'adh_file' | 'pan_file' | 'other_document';
    index?: number;
    label: string;
  } | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // Fetch policy details
  const {
    data: policy,
    error,
    isLoading,
    mutate,
  } = useSWR(`/api/v1/policies/${policyId}`, () => getPolicyById(policyId));

  // Fetch email logs
  const { data: emailLogs, mutate: mutateEmailLogs } = useSWR(
    showEmailLogsModal ? `/api/v1/emails/logs/${policyId}` : null,
    () => getEmailLogs(policyId)
  );

  const handleDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      await deletePolicy(policyId);
      toast.success('Policy deleted successfully');
      router.push('/policies');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete policy');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleViewFile = async (fileName: string) => {
    if (!policy) return;
    setLoadingFile(fileName);
    try {
      await viewFile(policy.drive_folder_id, fileName);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to view file');
    } finally {
      setLoadingFile(null);
    }
  };

  const handleDownloadFile = async (fileName: string, label: string) => {
    if (!policy) return;
    setLoadingFile(fileName);
    try {
      await downloadFile(policy.drive_folder_id, fileName, label);
      toast.success(`Downloaded ${label}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to download file');
    } finally {
      setLoadingFile(null);
    }
  };

  const handleDeleteFileClick = (
    type: 'adh_file' | 'pan_file' | 'other_document',
    label: string,
    index?: number
  ) => {
    setFileToDelete({ type, index, label });
    setShowDeleteFileModal(true);
  };

  const handleDeleteFileConfirm = async () => {
    if (!fileToDelete) return;

    setIsDeletingFile(true);
    try {
      await deletePolicyFile(policyId, fileToDelete.type, fileToDelete.index);
      toast.success(`${fileToDelete.label} deleted successfully`);
      mutate(); // Refresh policy data
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete file');
    } finally {
      setIsDeletingFile(false);
      setShowDeleteFileModal(false);
      setFileToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-red-600 font-medium">Failed to load policy details</p>
        <p className="text-gray-500 text-sm mt-1">
          The policy may have been deleted or you don't have access.
        </p>
        <Button variant="secondary" onClick={() => router.push('/policies')} className="mt-4">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Policies
        </Button>
      </div>
    );
  }

  // Check if there are any documents
  const hasDocuments =
    policy.adh_file ||
    policy.pan_file ||
    (policy.other_documents && policy.other_documents.length > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/policies')}
              className="mt-1"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{policy.policy_no}</h1>
                <Badge
                  variant={policy.ins_status === 'policy_done' ? 'success' : 'warning'}
                  className="text-sm"
                >
                  {policy.ins_status === 'policy_done' ? 'Completed' : 'Pending'}
                </Badge>
                <Badge
                  variant={policy.customer_payment_status === 'done' ? 'success' : 'warning'}
                  className="text-sm"
                >
                  {policy.customer_payment_status === 'done' ? 'Paid' : 'Payment Pending'}
                </Badge>
              </div>
              <p className="text-gray-500 mt-1">
                Serial: {policy.serial_no} • Created {formatDate(policy.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 ml-12 lg:ml-0">
            <Button variant="primary" onClick={() => setShowEmailModal(true)}>
              <EnvelopeIcon className="w-5 h-5 mr-2" />
              Send Email
            </Button>

            {/* Edit Button - Only for admin/owner */}
            {canEdit && (
              <Button variant="secondary" onClick={() => router.push(`/policies/${policyId}/edit`)}>
                <PencilIcon className="w-5 h-5 mr-2" />
                Edit
              </Button>
            )}

            {/* Delete Button - Only for admin/owner */}
            {canDelete && (
              <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                <TrashIcon className="w-5 h-5 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Quick Info Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-semibold text-gray-900 truncate max-w-[150px]">
                {policy.customer}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TruckIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Vehicle</p>
              <p className="font-semibold text-gray-900">{policy.registration_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CurrencyRupeeIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Premium</p>
              <p className="font-semibold text-gray-900">{formatCurrency(policy.premium_amount)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Valid Until</p>
              <p className="font-semibold text-gray-900">{formatDate(policy.end_date)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2 cols wide */}
        <div className="lg:col-span-2 space-y-6">
          {/* Policy Information */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheckIcon className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">Policy Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Policy Number</span>
                  <span className="font-medium text-gray-900">{policy.policy_no}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Serial Number</span>
                  <span className="font-medium text-gray-900">{policy.serial_no}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Issue Date</span>
                  <span className="font-medium text-gray-900">{formatDate(policy.issue_date)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Insurance Type</span>
                  <span className="font-medium text-gray-900">{policy.ins_type}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Start Date</span>
                  <span className="font-medium text-gray-900">{formatDate(policy.start_date)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">End Date</span>
                  <span className="font-medium text-gray-900">{formatDate(policy.end_date)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Insurance Company</span>
                  <span className="font-medium text-gray-900">{policy.ins_co_id}</span>
                </div>
                {policy.insurance_dealer && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Insurance Dealer</span>
                    <span className="font-medium text-gray-900">{policy.insurance_dealer}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Inspection</span>
                  <span className="font-medium text-gray-900">
                    {policy.inspection === 'yes' ? 'Required' : 'Not Required'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Branch</span>
                  <span className="font-medium text-gray-900">{policy.branch_id}</span>
                </div>
                {(policy.saod_start_date || policy.saod_end_date) && (
                  <>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">SAOD Start</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(policy.saod_start_date)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">SAOD End</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(policy.saod_end_date)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TruckIcon className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">Vehicle Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Product</span>
                  <span className="font-medium text-gray-900">{policy.product}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Manufacturer</span>
                  <span className="font-medium text-gray-900">{policy.manufacturer || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Model</span>
                  <span className="font-medium text-gray-900">{policy.model_name || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Fuel Type</span>
                  <span className="font-medium text-gray-900">{policy.fuel_type || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Registration No.</span>
                  <span className="font-bold text-gray-900">{policy.registration_number}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Registration Date</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(policy.registration_date)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Engine Number</span>
                  <span className="font-medium text-gray-900 font-mono text-sm">
                    {policy.engine_no || '-'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Chassis Number</span>
                  <span className="font-medium text-gray-900 font-mono text-sm">
                    {policy.chassis_no || '-'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Mfg. Date</span>
                  <span className="font-medium text-gray-900">{formatDate(policy.mfg_date)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Hypothecation</span>
                  <span className="font-medium text-gray-900">
                    {policy.hypothecation || 'None'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Premium & Add-ons */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CurrencyRupeeIcon className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">Premium Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Sum Insured</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(policy.sum_insured)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Net Premium</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(policy.net_premium)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">OD Premium</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(policy.od_premium)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">NCB</span>
                  <span className="font-medium text-gray-900">{policy.ncb || '-'}</span>
                </div>
                {policy.cng_value && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">CNG Value</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(policy.cng_value)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Agent Commission</span>
                  <span className="font-medium text-gray-900">
                    {policy.agent_commission ? formatCurrency(policy.agent_commission) : '-'}
                  </span>
                </div>
              </div>

              {/* Add-on Coverage */}
              {policy.addon_coverage && policy.addon_coverage.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Add-on Coverage</h3>
                  <div className="flex flex-wrap gap-2">
                    {policy.addon_coverage.map((addon, index) => {
                      const label = addon
                        .split('_')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                      return (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Total Premium */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Premium Amount</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(policy.premium_amount)}
                </span>
              </div>
            </div>
          </Card>

          {/* Payment Information */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCardIcon className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Payment */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Customer Payment
                  </h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-500 text-sm">Payment Type</dt>
                      <dd className="font-medium text-gray-900 text-sm">
                        {policy.customer_payment_type || '-'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500 text-sm">Status</dt>
                      <dd>
                        <Badge
                          variant={
                            policy.customer_payment_status === 'done' ? 'success' : 'warning'
                          }
                          className="text-xs"
                        >
                          {policy.customer_payment_status === 'done' ? 'Paid' : 'Pending'}
                        </Badge>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500 text-sm">Amount</dt>
                      <dd className="font-semibold text-gray-900">
                        {formatCurrency(policy.premium_amount)}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Company Payment */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <BuildingOfficeIcon className="w-4 h-4" />
                    Company Payment
                  </h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-500 text-sm">Payment Mode</dt>
                      <dd className="font-medium text-gray-900 text-sm">
                        {policy.company_payment_mode || '-'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500 text-sm">Bank</dt>
                      <dd className="font-medium text-gray-900 text-sm">
                        {policy.company_bank_name || '-'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500 text-sm">Amount</dt>
                      <dd className="font-semibold text-gray-900">
                        {policy.company_amount ? formatCurrency(policy.company_amount) : '-'}
                      </dd>
                    </div>
                    {policy.company_cheque_no && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500 text-sm">Cheque No.</dt>
                        <dd className="font-medium text-gray-900 text-sm">
                          {policy.company_cheque_no}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </Card>

          {/* Previous Policy Details */}
          {(policy.previous_policy_no || policy.previous_policy_company) && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ClockIcon className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-gray-900">Previous Policy Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Policy Number</span>
                    <span className="font-medium text-gray-900">
                      {policy.previous_policy_no || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Company</span>
                    <span className="font-medium text-gray-900">
                      {policy.previous_policy_company || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Expiry Date</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(policy.previous_policy_expiry_date)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">NCB</span>
                    <span className="font-medium text-gray-900">
                      {policy.previous_policy_ncb || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Claim Made</span>
                    <span
                      className={`font-medium ${policy.previous_policy_claim === 'yes' ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {policy.previous_policy_claim === 'yes' ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserIcon className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">Customer</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xl font-semibold text-gray-900">{policy.customer}</p>
                  <p className="text-sm text-gray-500">Executive: {policy.exicutive_name}</p>
                </div>
                <div className="space-y-2 text-sm">
                  {policy.mobile_no && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-16">Mobile:</span>
                      <a
                        href={`tel:${policy.mobile_no}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {policy.mobile_no}
                      </a>
                    </div>
                  )}
                  {policy.mobile_no_two && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-16">Alt:</span>
                      <a
                        href={`tel:${policy.mobile_no_two}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {policy.mobile_no_two}
                      </a>
                    </div>
                  )}
                  {policy.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-16">Email:</span>
                      <a
                        href={`mailto:${policy.email}`}
                        className="text-primary hover:underline font-medium truncate"
                      >
                        {policy.email}
                      </a>
                    </div>
                  )}
                  {policy.pan_no && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-16">PAN:</span>
                      <span className="font-medium font-mono">{policy.pan_no}</span>
                    </div>
                  )}
                  {policy.adh_id && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-16">Aadhaar:</span>
                      <span className="font-medium font-mono">{policy.adh_id}</span>
                    </div>
                  )}
                </div>
                {(policy.address_1 || policy.city_id) && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      {policy.address_1}
                      {policy.address_1 && policy.city_id && ', '}
                      {policy.city_id}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Nominee Information */}
          {policy.nominee_name && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <UserGroupIcon className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-gray-900">Nominee</h2>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium text-gray-900">{policy.nominee_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date of Birth</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(policy.nominee_dob)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Relation</span>
                    <span className="font-medium text-gray-900">
                      {policy.nominee_relation || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Documents */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <DocumentDuplicateIcon className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
              </div>

              {hasDocuments ? (
                <div className="space-y-3">
                  {/* Aadhaar */}
                  {policy.adh_file && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Aadhaar Card</p>
                          <p className="text-xs text-gray-500">{policy.adh_id}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleViewFile(policy.adh_file!.file_name)}
                          disabled={loadingFile === policy.adh_file!.file_name}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                          title="View"
                        >
                          {loadingFile === policy.adh_file!.file_name ? (
                            <Spinner size="sm" />
                          ) : (
                            <EyeIcon className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleDownloadFile(
                              policy.adh_file!.file_name,
                              `Aadhaar_${policy.adh_id}`
                            )
                          }
                          disabled={loadingFile === policy.adh_file!.file_name}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                          title="Download"
                        >
                          <DocumentArrowDownIcon className="w-4 h-4 text-gray-600" />
                        </button>
                        {/* Delete button - Only for admin/owner */}
                        {canDeleteDocuments && (
                          <button
                            onClick={() => handleDeleteFileClick('adh_file', 'Aadhaar Card')}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PAN */}
                  {policy.pan_file && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <DocumentTextIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">PAN Card</p>
                          <p className="text-xs text-gray-500">{policy.pan_no}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleViewFile(policy.pan_file!.file_name)}
                          disabled={loadingFile === policy.pan_file!.file_name}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                          title="View"
                        >
                          {loadingFile === policy.pan_file!.file_name ? (
                            <Spinner size="sm" />
                          ) : (
                            <EyeIcon className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleDownloadFile(policy.pan_file!.file_name, `PAN_${policy.pan_no}`)
                          }
                          disabled={loadingFile === policy.pan_file!.file_name}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                          title="Download"
                        >
                          <DocumentArrowDownIcon className="w-4 h-4 text-gray-600" />
                        </button>
                        {/* Delete button - Only for admin/owner */}
                        {canDeleteDocuments && (
                          <button
                            onClick={() => handleDeleteFileClick('pan_file', 'PAN Card')}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Other Documents */}
                  {policy.other_documents &&
                    policy.other_documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{doc.label}</p>
                            <p className="text-xs text-gray-500">{doc.file_name}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleViewFile(doc.file_name)}
                            disabled={loadingFile === doc.file_name}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            title="View"
                          >
                            {loadingFile === doc.file_name ? (
                              <Spinner size="sm" />
                            ) : (
                              <EyeIcon className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDownloadFile(doc.file_name, doc.label)}
                            disabled={loadingFile === doc.file_name}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            title="Download"
                          >
                            <DocumentArrowDownIcon className="w-4 h-4 text-gray-600" />
                          </button>
                          {/* Delete button - Only for admin/owner */}
                          {canDeleteDocuments && (
                            <button
                              onClick={() =>
                                handleDeleteFileClick('other_document', doc.label, index)
                              }
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No documents uploaded</p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => setShowEmailModal(true)}
                >
                  <EnvelopeIcon className="w-4 h-4 mr-2" />
                  Send Backup Email
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setShowEmailLogsModal(true)}
                >
                  <ClockIcon className="w-4 h-4 mr-2" />
                  View Email History
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Send Email Modal */}
      {policy && (
        <SendEmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          policy={policy}
          onSuccess={() => mutateEmailLogs()}
        />
      )}

      {/* Delete Policy Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmText('');
        }}
        title="Delete Policy"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              Are you sure you want to delete policy <strong>{policy.policy_no}</strong>?
            </p>
          </div>
          <p className="text-sm text-gray-600">
            This action cannot be undone. A backup will be created before deletion.
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
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
              disabled={deleteConfirmText !== 'DELETE' || isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Policy'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete File Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteFileModal}
        onClose={() => {
          setShowDeleteFileModal(false);
          setFileToDelete(null);
        }}
        onConfirm={handleDeleteFileConfirm}
        title="Delete Document"
        message={`Are you sure you want to delete "${fileToDelete?.label}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeletingFile}
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
            emailLogs.map((log) => (
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
                    <span className="text-gray-500">Sent by:</span> {log.sent_by.email}
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
