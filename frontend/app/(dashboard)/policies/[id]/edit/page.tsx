'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { getPolicyById } from '@/lib/api/policies';
import { useAuth } from '@/lib/hooks/useAuth';
import { PolicyFormProvider, usePolicyForm } from '@/lib/context/PolicyFormContext';
import { PolicyWizard } from '@/components/policies/PolicyWizard';
import { Step1PolicyDetails } from '@/components/policies/steps/Step1PolicyDetails';
import { Step2CustomerDetails } from '@/components/policies/steps/Step2CustomerDetails';
import { Step3VehicleDetails } from '@/components/policies/steps/Step3VehicleDetails';
import { Step4PremiumDetails } from '@/components/policies/steps/Step4PremiumDetails';
import { Step5PaymentDetails } from '@/components/policies/steps/Step5PaymentDetails';
import { Step6ReviewSubmit } from '@/components/policies/steps/Step6ReviewSubmit';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { AccessDenied } from '@/components/admin/AccessDenied';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';

function EditPolicyFormContent({ policyId }: { policyId: string }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { formData, updateFormData, resetForm } = usePolicyForm();
  const router = useRouter();

  // Fetch existing policy
  const {
    data: policy,
    error,
    isLoading,
  } = useSWR(`/api/v1/policies/${policyId}`, () => getPolicyById(policyId));

  // Pre-fill form with existing data
  useEffect(() => {
    if (policy && !isInitialized) {
      // Format dates to YYYY-MM-DD for input fields
      const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return '';
        try {
          return new Date(dateStr).toISOString().split('T')[0];
        } catch {
          return '';
        }
      };

      updateFormData({
        // Policy Details (serial_no is read-only, not editable)
        policy_no: policy.policy_no,
        issue_date: formatDate(policy.issue_date),
        ins_type: policy.ins_type,
        start_date: formatDate(policy.start_date),
        end_date: formatDate(policy.end_date),
        ins_status: policy.ins_status,
        ins_co_id: policy.ins_co_id,
        insurance_dealer: policy.insurance_dealer,
        saod_start_date: formatDate(policy.saod_start_date),
        saod_end_date: formatDate(policy.saod_end_date),
        inspection: policy.inspection,

        // Customer Details
        branch_id: policy.branch_id,
        exicutive_name: policy.exicutive_name,
        customer: policy.customer,
        adh_id: policy.adh_id,
        pan_no: policy.pan_no,
        mobile_no: policy.mobile_no,
        mobile_no_two: policy.mobile_no_two,
        email: policy.email,
        city_id: policy.city_id,
        address_1: policy.address_1,

        // Existing file references (for display in form)
        existing_adh_file: policy.adh_file || null,
        existing_pan_file: policy.pan_file || null,

        // Nominee Details
        nominee_name: policy.nominee_name,
        nominee_dob: formatDate(policy.nominee_dob),
        nominee_relation: policy.nominee_relation,

        // Vehicle Details
        product: policy.product,
        manufacturer: policy.manufacturer,
        fuel_type: policy.fuel_type,
        model_name: policy.model_name,
        hypothecation: policy.hypothecation,
        mfg_date: formatDate(policy.mfg_date),
        engine_no: policy.engine_no,
        chassis_no: policy.chassis_no,
        registration_number: policy.registration_number,
        registration_date: formatDate(policy.registration_date),

        // Premium Details
        sum_insured: policy.sum_insured,
        cng_value: policy.cng_value,
        ncb: policy.ncb,
        net_premium: policy.net_premium,
        od_premium: policy.od_premium,
        addon_coverage: policy.addon_coverage || [],
        agent_commission: policy.agent_commission,
        date: formatDate(policy.date),
        other_remark: policy.other_remark,

        // Previous Policy Details
        previous_policy_no: policy.previous_policy_no,
        previous_policy_company: policy.previous_policy_company,
        previous_policy_expiry_date: formatDate(policy.previous_policy_expiry_date),
        previous_policy_ncb: policy.previous_policy_ncb,
        previous_policy_claim: policy.previous_policy_claim,

        // Customer Payment
        premium_amount: policy.premium_amount,
        customer_payment_type: policy.customer_payment_type,
        customer_payment_status: policy.customer_payment_status,
        voucher_no: policy.voucher_no,
        payment_details: policy.payment_details || [],
        extra_amount: policy.extra_amount,

        // Company Payment
        company_payment_mode: policy.company_payment_mode,
        company_bank_name: policy.company_bank_name,
        company_cheque_no: policy.company_cheque_no,
        company_amount: policy.company_amount,
        company_cheque_date: formatDate(policy.company_cheque_date),
      });

      setIsInitialized(true);
    }
  }, [policy, isInitialized, updateFormData]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (
          !formData.policy_no ||
          !formData.issue_date ||
          !formData.ins_type ||
          !formData.start_date ||
          !formData.end_date ||
          !formData.ins_status ||
          !formData.ins_co_id ||
          !formData.inspection
        ) {
          toast.error('Please fill all required fields in Policy Details');
          return false;
        }
        break;
      case 2:
        if (!formData.customer || !formData.branch_id || !formData.exicutive_name) {
          toast.error('Please fill Customer Name, Branch, and Executive Name');
          return false;
        }
        break;
      case 3:
        if (!formData.registration_number || !formData.product) {
          toast.error('Please fill Product and Registration Number');
          return false;
        }
        break;
      case 4:
        break;
      case 5:
        if (!formData.premium_amount || !formData.customer_payment_status) {
          toast.error('Please fill Premium Amount and Payment Status');
          return false;
        }
        break;
      case 6:
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    // Validate all steps before submit
    for (let step = 1; step <= 6; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();

      // Collect other_documents labels separately
      const otherDocLabels: string[] = [];

      Object.entries(formData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        // Skip existing file references (they're just for display)
        if (key === 'existing_adh_file' || key === 'existing_pan_file') return;

        // Handle file deletion flags
        if (key === 'adh_file_delete' && value === true) {
          submitData.append('delete_adh_file', 'true');
          return;
        }
        if (key === 'pan_file_delete' && value === true) {
          submitData.append('delete_pan_file', 'true');
          return;
        }

        // Handle Aadhaar file
        if (key === 'adh_file') {
          if (value instanceof File) {
            submitData.append('adh_file', value);
          }
          return;
        }

        // Handle PAN file
        if (key === 'pan_file') {
          if (value instanceof File) {
            submitData.append('pan_file', value);
          }
          return;
        }

        // Handle other_documents - send as separate fields
        if (key === 'other_documents') {
          const docs = value as Array<{ file: File; label: string }>;
          docs.forEach((doc, index) => {
            if (doc.file instanceof File) {
              submitData.append(`other_doc_${index}`, doc.file);
              otherDocLabels.push(doc.label);
            }
          });
          return;
        }

        // Handle arrays (stringify them)
        if (key === 'addon_coverage' || key === 'payment_details') {
          submitData.append(key, JSON.stringify(value));
          return;
        }

        // Handle regular fields
        if (typeof value === 'object') {
          submitData.append(key, JSON.stringify(value));
        } else {
          submitData.append(key, String(value));
        }
      });

      // Append other_doc_labels as JSON array
      if (otherDocLabels.length > 0) {
        submitData.append('other_doc_labels', JSON.stringify(otherDocLabels));
      }

      // Debug: Log what we're sending
      console.log('📤 Updating policy with fields:');
      for (const [key, value] of submitData.entries()) {
        if (value instanceof File) {
          console.log(`   ${key}: [File] ${value.name}`);
        } else {
          console.log(`   ${key}: ${value}`);
        }
      }

      // Submit to backend
      await apiClient.patch(`/api/v1/policies/${policyId}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Policy updated successfully!');
      router.push(`/policies/${policyId}`);
    } catch (error: any) {
      console.error('Update error:', error);
      const message = error?.response?.data?.message || 'Failed to update policy';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1PolicyDetails />;
      case 2:
        return <Step2CustomerDetails />;
      case 3:
        return <Step3VehicleDetails />;
      case 4:
        return <Step4PremiumDetails />;
      case 5:
        return <Step5PaymentDetails />;
      case 6:
        return <Step6ReviewSubmit />;
      default:
        return <Step1PolicyDetails />;
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
        <p className="text-red-600">Failed to load policy</p>
        <Button variant="ghost" onClick={() => router.push('/policies')} className="mt-4">
          ← Back to Policies
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Policy</h1>
        <p className="text-gray-600 mt-1">
          {policy.policy_no} (Serial: {policy.serial_no}) - Step {currentStep} of 6
        </p>
      </div>

      <PolicyWizard currentStep={currentStep}>
        {renderStep()}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <Button variant="ghost" onClick={handlePrevious} disabled={currentStep === 1}>
            ← Previous
          </Button>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                if (confirm('Discard changes?')) {
                  router.push(`/policies/${policyId}`);
                }
              }}
            >
              Cancel
            </Button>

            {currentStep < 6 ? (
              <Button variant="primary" onClick={handleNext}>
                Next →
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating Policy...' : 'Update Policy'}
              </Button>
            )}
          </div>
        </div>
      </PolicyWizard>

      {/* Info about existing documents */}
      {policy.other_documents && policy.other_documents.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>📄 Existing Documents:</strong> This policy has {policy.other_documents.length}{' '}
            other document(s) already uploaded. New documents added will be appended to existing
            ones.
          </p>
        </div>
      )}
    </div>
  );
}

export default function EditPolicyPage() {
  const params = useParams();
  const policyId = params.id as string;
  const { user, isLoading } = useAuth();

  // Check if user has permission to edit
  const canEdit = user?.role === 'owner' || user?.role === 'admin';

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Block access for regular users
  if (!canEdit) {
    return (
      <AccessDenied message="You don't have permission to edit policies. Only administrators and owners can edit policies." />
    );
  }

  return (
    <PolicyFormProvider>
      <EditPolicyFormContent policyId={policyId} />
    </PolicyFormProvider>
  );
}
