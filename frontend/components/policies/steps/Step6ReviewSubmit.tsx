'use client';

import { SingleDatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { usePolicyForm } from '@/lib/context/PolicyFormContext';
import { usePolicyFormMeta } from '@/lib/hooks/useMeta';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import {
  DocumentTextIcon,
  UserIcon,
  TruckIcon,
  CurrencyRupeeIcon,
  BuildingOfficeIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export function Step6ReviewSubmit() {
  const { formData, updateFormData } = usePolicyForm();
  const { companyPaymentModes, companyBankNames, isLoading } = usePolicyFormMeta();

  // Helper to render field value or placeholder
  const renderValue = (value: any, fallback = '-') => {
    if (value === null || value === undefined || value === '') return fallback;
    return value;
  };

  // Helper to render currency
  const renderCurrency = (value: any) => {
    if (value === null || value === undefined || value === '') return '-';
    return formatCurrency(value);
  };

  // Helper to render status badge
  const renderStatus = (value: string | undefined, type: 'payment' | 'policy' = 'payment') => {
    if (!value) return <span className="text-gray-400">-</span>;

    const isPositive = type === 'payment' ? value === 'done' : value === 'policy_done';

    return (
      <span
        className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        ${isPositive ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}
      `}
      >
        {isPositive ? (
          <CheckCircleIcon className="w-3.5 h-3.5" />
        ) : (
          <XCircleIcon className="w-3.5 h-3.5" />
        )}
        {value}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Company Payment Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BuildingOfficeIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Company Payment Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Payment Mode</label>
            <select
              value={formData.company_payment_mode || ''}
              onChange={(e) => updateFormData({ company_payment_mode: e.target.value })}
              className="input"
              disabled={isLoading}
            >
              <option value="">{isLoading ? 'Loading...' : 'Select mode'}</option>
              {companyPaymentModes.map((mode) => (
                <option key={mode.id} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Bank Name</label>
            <select
              value={formData.company_bank_name || ''}
              onChange={(e) => updateFormData({ company_bank_name: e.target.value })}
              className="input"
              disabled={isLoading}
            >
              <option value="">{isLoading ? 'Loading...' : 'Select bank'}</option>
              {companyBankNames.map((bank) => (
                <option key={bank.id} value={bank.value}>
                  {bank.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Amount"
            type="number"
            placeholder="Company payment amount (optional)"
            value={formData.company_amount || ''}
            onChange={(e) =>
              updateFormData({ company_amount: parseFloat(e.target.value) || undefined })
            }
          />

          {/* ✅ RENAMED: Cheque Number / UTR / Transaction Number */}
          <Input
            label="Cheque Number / UTR / Transaction Number"
            type="text"
            placeholder="Enter cheque no., UTR, or transaction ID"
            value={formData.company_cheque_no || ''}
            onChange={(e) => updateFormData({ company_cheque_no: e.target.value })}
          />

          <SingleDatePicker
            label="Cheque / Transaction Date"
            value={formData.company_cheque_date ? new Date(formData.company_cheque_date) : null}
            onChange={(date) =>
              updateFormData({ company_cheque_date: date ? date.toISOString().split('T')[0] : '' })
            }
            placeholder="Cheque / Transaction Date"
          />
        </div>
      </div>

      {/* ✅ REMADE: Review Summary */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Review Summary</h3>

        <div className="space-y-6">
          {/* Row 1: Policy & Customer Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Policy Information */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Policy Information</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-blue-200/50">
                  <span className="text-sm text-blue-700">Policy Number</span>
                  <span className="font-semibold text-blue-900">
                    {renderValue(formData.policy_no)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-200/50">
                  <span className="text-sm text-blue-700">Insurance Type</span>
                  <span className="font-medium text-blue-900">
                    {renderValue(formData.ins_type)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-200/50">
                  <span className="text-sm text-blue-700">Company</span>
                  <span className="font-medium text-blue-900">
                    {renderValue(formData.ins_co_id)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-200/50">
                  <span className="text-sm text-blue-700">Status</span>
                  {renderStatus(formData.ins_status, 'policy')}
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-200/50">
                  <span className="text-sm text-blue-700">Policy Period</span>
                  <span className="font-medium text-blue-900">
                    {formData.start_date && formData.end_date
                      ? `${formatDate(formData.start_date)} → ${formatDate(formData.end_date)}`
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-blue-700">Inspection Required</span>
                  <span
                    className={`font-medium ${formData.inspection === 'yes' ? 'text-amber-600' : 'text-green-600'}`}
                  >
                    {formData.inspection ? formData.inspection.toUpperCase() : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <UserIcon className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-900">Customer Information</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-green-200/50">
                  <span className="text-sm text-green-700">Name</span>
                  <span className="font-semibold text-green-900">
                    {renderValue(formData.customer)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-green-200/50">
                  <span className="text-sm text-green-700">Mobile</span>
                  <span className="font-medium text-green-900">
                    {renderValue(formData.mobile_no)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-green-200/50">
                  <span className="text-sm text-green-700">Email</span>
                  <span className="font-medium text-green-900 text-right max-w-[180px] truncate">
                    {renderValue(formData.email)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-green-200/50">
                  <span className="text-sm text-green-700">PAN Number</span>
                  <span className="font-mono font-medium text-green-900">
                    {renderValue(formData.pan_no)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-green-200/50">
                  <span className="text-sm text-green-700">Branch</span>
                  <span className="font-medium text-green-900">
                    {renderValue(formData.branch_id)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-green-700">Executive</span>
                  <span className="font-medium text-green-900">
                    {renderValue(formData.exicutive_name)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Vehicle & Financial Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle Information */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TruckIcon className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-purple-900">Vehicle Information</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-purple-200/50">
                  <span className="text-sm text-purple-700">Vehicle</span>
                  <span className="font-semibold text-purple-900">
                    {formData.manufacturer || formData.model_name
                      ? `${formData.manufacturer || ''} ${formData.model_name || ''}`.trim()
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-purple-200/50">
                  <span className="text-sm text-purple-700">Product Type</span>
                  <span className="font-medium text-purple-900">
                    {renderValue(formData.product)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-purple-200/50">
                  <span className="text-sm text-purple-700">Registration No.</span>
                  <span className="font-mono font-bold text-purple-900 tracking-wider">
                    {renderValue(formData.registration_number)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-purple-200/50">
                  <span className="text-sm text-purple-700">Fuel Type</span>
                  <span className="font-medium text-purple-900">
                    {renderValue(formData.fuel_type)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-purple-200/50">
                  <span className="text-sm text-purple-700">Engine No.</span>
                  <span className="font-mono text-sm text-purple-900">
                    {renderValue(formData.engine_no)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-purple-700">Chassis No.</span>
                  <span className="font-mono text-sm text-purple-900">
                    {renderValue(formData.chassis_no)}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CurrencyRupeeIcon className="w-5 h-5 text-amber-600" />
                <h4 className="font-semibold text-amber-900">Financial Summary</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-amber-200/50">
                  <span className="text-sm text-amber-700">Total Premium (GST)</span>
                  <span className="font-semibold text-amber-900">
                    {renderCurrency(formData.total_premium_gst)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-amber-200/50">
                  <span className="text-sm text-amber-700">Customer Premium</span>
                  <span className="font-medium text-amber-900">
                    {renderCurrency(formData.premium_amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-amber-200/50">
                  <span className="text-sm text-amber-700">Extra Amount</span>
                  <span
                    className={`font-medium ${(formData.extra_amount || 0) < 0 ? 'text-red-600' : 'text-amber-900'}`}
                  >
                    {renderCurrency(formData.extra_amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-amber-200/50">
                  <span className="text-sm text-amber-700">Agent Commission</span>
                  <span className="font-medium text-amber-900">
                    {renderCurrency(formData.agent_commission)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-amber-200/50">
                  <span className="text-sm text-amber-700">Profit</span>
                  <span
                    className={`font-bold ${(formData.profit || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {renderCurrency(formData.profit)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-amber-700">Payment Status</span>
                  {renderStatus(formData.customer_payment_status)}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Previous Policy (if exists) */}
          {formData.has_previous_policy &&
            (formData.previous_policy_no || formData.previous_policy_company) && (
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <DocumentDuplicateIcon className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-semibold text-indigo-900">Previous Policy Details</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-indigo-600 uppercase tracking-wider">
                      Policy No.
                    </span>
                    <p className="font-medium text-indigo-900 mt-1">
                      {renderValue(formData.previous_policy_no)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-indigo-600 uppercase tracking-wider">
                      Company
                    </span>
                    <p className="font-medium text-indigo-900 mt-1">
                      {renderValue(formData.previous_policy_company)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-indigo-600 uppercase tracking-wider">
                      Expiry Date
                    </span>
                    <p className="font-medium text-indigo-900 mt-1">
                      {formData.previous_policy_expiry_date
                        ? formatDate(formData.previous_policy_expiry_date)
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-indigo-600 uppercase tracking-wider">NCB</span>
                    <p className="font-medium text-indigo-900 mt-1">
                      {renderValue(formData.previous_policy_ncb)}
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Documents Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <h4 className="font-semibold text-gray-900 mb-4">Documents Attached</h4>
            <div className="flex flex-wrap gap-4">
              <div
                className={`
                flex items-center gap-2 px-3 py-2 rounded-lg
                ${formData.adh_file ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
              `}
              >
                {formData.adh_file ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <XCircleIcon className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">Aadhaar</span>
              </div>
              <div
                className={`
                flex items-center gap-2 px-3 py-2 rounded-lg
                ${formData.pan_file ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
              `}
              >
                {formData.pan_file ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <XCircleIcon className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">PAN Card</span>
              </div>
              {formData.other_documents && formData.other_documents.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100 text-blue-700">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {formData.other_documents.length} Other Doc(s)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>📝 Note:</strong> Serial number will be auto-generated when you submit this
              policy (format: AS20250001). Please review all details before submitting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
