'use client';

import { Input } from '@/components/ui/Input';
import { SingleDatePicker } from '@/components/ui/DatePicker';
import { usePolicyForm } from '@/lib/context/PolicyFormContext';
import { usePolicyFormMeta } from '@/lib/hooks/useMeta';
import { useEffect, useState } from 'react';

export function Step1PolicyDetails() {
  const { formData, updateFormData } = usePolicyForm();
  const { insTypes, insStatuses, insCompanies, insuranceDealers, isLoading } = usePolicyFormMeta();

  // Calculate end date when start date changes (1 year policy)
  useEffect(() => {
    if (formData.start_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      endDate.setDate(endDate.getDate() - 1);
      updateFormData({
        end_date: endDate.toISOString().split('T')[0],
      });
    }
  }, [formData.start_date]);

  // Auto-sync SAOD start date with policy start date
  useEffect(() => {
    if (formData.saod_start_date) {
      const saodStartDate = new Date(formData.saod_start_date);
      const saodEndDate = new Date(saodStartDate);
      saodEndDate.setFullYear(saodEndDate.getFullYear() + 1);
      saodEndDate.setDate(saodEndDate.getDate() - 1);
      updateFormData({
        saod_end_date: saodEndDate.toISOString().split('T')[0],
      });
    }
  }, [formData.saod_start_date]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Policy Number"
          type="text"
          placeholder="POL-2025-001"
          value={formData.policy_no || ''}
          onChange={(e) => {
            // Block characters that are invalid in folder names: / \ : * ? " < > |
            const invalidChars = /[/\\:*?"<>|]/g;
            const sanitizedValue = e.target.value.replace(invalidChars, '');
            updateFormData({ policy_no: sanitizedValue });
          }}
          required
        />

        <SingleDatePicker
          label="Issue Date"
          value={formData.issue_date ? new Date(formData.issue_date) : null}
          onChange={(date) =>
            updateFormData({ issue_date: date ? date.toISOString().split('T')[0] : '' })
          }
          placeholder="Select Issue date"
        />

        <div>
          <label className="label label-required">Insurance Type</label>
          <select
            value={formData.ins_type || ''}
            onChange={(e) => updateFormData({ ins_type: e.target.value })}
            className="input"
            disabled={isLoading}
          >
            <option value="">{isLoading ? 'Loading...' : 'Select type'}</option>
            {insTypes.map((type) => (
              <option key={type.id} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <SingleDatePicker
          label="Start Date"
          value={formData.start_date ? new Date(formData.start_date) : null}
          onChange={(date) =>
            updateFormData({ start_date: date ? date.toISOString().split('T')[0] : '' })
          }
          placeholder="Select Start date"
        />

        <SingleDatePicker
          label="End Date"
          value={formData.end_date ? new Date(formData.end_date) : null}
          onChange={(date) =>
            updateFormData({ end_date: date ? date.toISOString().split('T')[0] : '' })
          }
          placeholder="Select End date"
        />

        <div>
          <label className="label label-required">Insurance Status</label>
          <select
            value={formData.ins_status || ''}
            onChange={(e) => updateFormData({ ins_status: e.target.value })}
            className="input"
            disabled={isLoading}
          >
            <option value="">{isLoading ? 'Loading...' : 'Select status'}</option>
            {insStatuses.map((status) => (
              <option key={status.id} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label label-required">Insurance Company</label>
          <select
            value={formData.ins_co_id || ''}
            onChange={(e) => updateFormData({ ins_co_id: e.target.value })}
            className="input"
            disabled={isLoading}
          >
            <option value="">{isLoading ? 'Loading...' : 'Select company'}</option>
            {insCompanies.map((company) => (
              <option key={company.id} value={company.value}>
                {company.label}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ NEW: Insurance Dealer Dropdown */}
        <div>
          <label className="label">Insurance Dealer</label>
          <select
            value={formData.insurance_dealer || ''}
            onChange={(e) => updateFormData({ insurance_dealer: e.target.value })}
            className="input"
            disabled={isLoading}
          >
            <option value="">{isLoading ? 'Loading...' : 'Select dealer (optional)'}</option>
            {insuranceDealers.map((dealer) => (
              <option key={dealer.id} value={dealer.value}>
                {dealer.label}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ MANUAL: SAOD Start Date (no auto-sync) */}

        <SingleDatePicker
          label="SAOD Start Date"
          value={formData.saod_start_date ? new Date(formData.saod_start_date) : null}
          onChange={(date) =>
            updateFormData({ saod_start_date: date ? date.toISOString().split('T')[0] : '' })
          }
          placeholder="Select Issue date"
        />

        <SingleDatePicker
          label="SAOD End Date"
          value={formData.saod_end_date ? new Date(formData.saod_end_date) : null}
          onChange={(date) =>
            updateFormData({ saod_end_date: date ? date.toISOString().split('T')[0] : '' })
          }
          placeholder="Select Issue date"
        />

        <div>
          <label className="label label-required">Inspection Required</label>
          <select
            value={formData.inspection || ''}
            onChange={(e) => updateFormData({ inspection: e.target.value as 'yes' | 'no' })}
            className="input"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>
    </div>
  );
}
