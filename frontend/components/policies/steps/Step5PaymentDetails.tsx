'use client';

import { useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { usePolicyForm } from '@/lib/context/PolicyFormContext';
import { usePolicyFormMeta } from '@/lib/hooks/useMeta';
import { PlusIcon, TrashIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils/formatters';

export function Step5PaymentDetails() {
  const { formData, updateFormData } = usePolicyForm();
  const { customerPaymentTypes, paymentModes, isLoading } = usePolicyFormMeta();

  // ✅ Auto-calculate extra_amount and profit whenever dependencies change
  useEffect(() => {
    const totalPremiumGst = formData.total_premium_gst || 0;
    const premiumAmount = formData.premium_amount || 0;
    const agentCommission = formData.agent_commission || 0;

    // Calculate extra_amount = total_premium_gst - premium_amount
    const calculatedExtraAmount = totalPremiumGst - premiumAmount;

    // Calculate profit = agent_commission - extra_amount
    const calculatedProfit = agentCommission - calculatedExtraAmount;

    // Only update if values changed to avoid infinite loop
    if (formData.extra_amount !== calculatedExtraAmount || formData.profit !== calculatedProfit) {
      updateFormData({
        extra_amount: calculatedExtraAmount,
        profit: calculatedProfit,
      });
    }
  }, [formData.total_premium_gst, formData.premium_amount, formData.agent_commission]);

  const addPaymentDetail = () => {
    const current = formData.payment_details || [];
    updateFormData({
      payment_details: [...current, { payment_mode: '', collect_amount: 0, collect_remark: '' }],
    });
  };

  const removePaymentDetail = (index: number) => {
    const current = formData.payment_details || [];
    updateFormData({
      payment_details: current.filter((_, i) => i !== index),
    });
  };

  const updatePaymentDetail = (index: number, field: string, value: any) => {
    const current = formData.payment_details || [];
    const updated = [...current];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ payment_details: updated });
  };

  return (
    <div className="space-y-6">
      {/* Customer Payment Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Customer Payment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Customer Premium Amount"
            type="number"
            placeholder="Total premium amount"
            value={formData.premium_amount || ''}
            onChange={(e) =>
              updateFormData({ premium_amount: parseFloat(e.target.value) || undefined })
            }
            required
          />

          {/* Payment Type */}
          <div>
            <label className="label">Payment Type</label>
            <select
              value={formData.customer_payment_type || ''}
              onChange={(e) => updateFormData({ customer_payment_type: e.target.value })}
              className="input"
              disabled={isLoading}
            >
              <option value="">{isLoading ? 'Loading...' : 'Select payment type'}</option>
              {customerPaymentTypes.map((type) => (
                <option key={type.id} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label label-required">Payment Status</label>
            <select
              value={formData.customer_payment_status || ''}
              onChange={(e) =>
                updateFormData({ customer_payment_status: e.target.value as 'pending' | 'done' })
              }
              className="input"
            >
              <option value="">Select status</option>
              <option value="pending">Pending</option>
              <option value="done">Done</option>
            </select>
          </div>

          <Input
            label="REMARK"
            type="text"
            placeholder="Add remark (optional)"
            value={formData.voucher_no || ''}
            onChange={(e) => updateFormData({ voucher_no: e.target.value || undefined })}
          />
        </div>
      </div>

      {/* ✅ Auto-Calculated Fields Section */}
      <div className="border-t border-slate-200/70 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <CalculatorIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-slate-900">Calculated Fields</h3>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
            Auto-calculated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ✅ Extra Amount (Auto-calculated, read-only) */}
          <div>
            <label className="label">
              Extra Amount
              <span className="ml-2 text-xs text-slate-500">(Total Premium - Customer Premium)</span>
            </label>
            <div
              className={`
              input bg-slate-100/80 cursor-not-allowed font-medium
              ${(formData.extra_amount || 0) < 0 ? 'text-red-600' : 'text-slate-900'}
            `}
            >
              {formatCurrency(formData.extra_amount || 0)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {formData.total_premium_gst || 0} - {formData.premium_amount || 0} ={' '}
              {formData.extra_amount || 0}
            </p>
          </div>

          {/* ✅ Profit (Auto-calculated, read-only) */}
          <div>
            <label className="label">
              Profit
              <span className="ml-2 text-xs text-slate-500">(Agent Commission - Extra Amount)</span>
            </label>
            <div
              className={`
              input bg-slate-100/80 cursor-not-allowed font-medium
              ${(formData.profit || 0) < 0 ? 'text-red-600' : 'text-green-600'}
            `}
            >
              {formatCurrency(formData.profit || 0)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {formData.agent_commission || 0} - {formData.extra_amount || 0} ={' '}
              {formData.profit || 0}
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-4 rounded-[18px] border border-sky-200/80 bg-sky-50/70 p-3">
          <p className="text-sm text-slate-700">
            <strong>Note:</strong> Extra Amount and Profit are automatically calculated based on:
          </p>
          <ul className="mt-2 ml-4 list-disc text-sm text-slate-600">
            <li>
              Total Premium with GST (from Step 4):{' '}
              <strong>{formatCurrency(formData.total_premium_gst || 0)}</strong>
            </li>
            <li>
              Customer Premium Amount:{' '}
              <strong>{formatCurrency(formData.premium_amount || 0)}</strong>
            </li>
            <li>
              Agent Commission (from Step 4):{' '}
              <strong>{formatCurrency(formData.agent_commission || 0)}</strong>
            </li>
          </ul>
        </div>
      </div>

      {/* Payment Details Repeating Group */}
      <div className="border-t border-slate-200/70 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Payment Details</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={addPaymentDetail}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Payment
          </Button>
        </div>

        {formData.payment_details && formData.payment_details.length > 0 ? (
          <div className="space-y-4">
            {formData.payment_details.map((payment, index) => (
              <div key={index} className="rounded-[18px] border border-slate-200/70 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-900">Payment #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removePaymentDetail(index)}
                    className="text-danger hover:text-danger-600"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Payment Mode</label>
                    <select
                      value={payment.payment_mode}
                      onChange={(e) => updatePaymentDetail(index, 'payment_mode', e.target.value)}
                      className="input"
                      disabled={isLoading}
                    >
                      <option value="">{isLoading ? 'Loading...' : 'Select mode'}</option>
                      {paymentModes.map((mode) => (
                        <option key={mode.id} value={mode.value}>
                          {mode.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Collect Amount</label>
                    <input
                      type="number"
                      value={payment.collect_amount}
                      onChange={(e) =>
                        updatePaymentDetail(
                          index,
                          'collect_amount',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="input"
                      placeholder="Amount"
                    />
                  </div>

                  <div>
                    <label className="label">Remark</label>
                    <input
                      type="text"
                      value={payment.collect_remark || ''}
                      onChange={(e) => updatePaymentDetail(index, 'collect_remark', e.target.value)}
                      className="input"
                      placeholder="Optional note"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[18px] border-2 border-dashed border-slate-300 bg-slate-50/70 py-8 text-center">
            <p className="text-slate-500">No payment details added yet</p>
            <Button variant="ghost" size="sm" onClick={addPaymentDetail} className="mt-2">
              Add First Payment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
