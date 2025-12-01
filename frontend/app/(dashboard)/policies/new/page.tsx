'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PolicyFormProvider, usePolicyForm } from '@/lib/context/PolicyFormContext';
import { PolicyWizard } from '@/components/policies/PolicyWizard';
import { Step1PolicyDetails } from '@/components/policies/steps/Step1PolicyDetails';
import { Step2CustomerDetails } from '@/components/policies/steps/Step2CustomerDetails';
import { Step3VehicleDetails } from '@/components/policies/steps/Step3VehicleDetails';
import { Step4PremiumDetails } from '@/components/policies/steps/Step4PremiumDetails';
import { Step5PaymentDetails } from '@/components/policies/steps/Step5PaymentDetails';
import { Step6ReviewSubmit } from '@/components/policies/steps/Step6ReviewSubmit';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';

function NewPolicyFormContent() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { formData, resetForm } = usePolicyForm();
  const router = useRouter();

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // ✅ UPDATED: Removed serial_no (auto-generated), updated required fields
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
        // ✅ UPDATED: Only customer name, branch, and executive are required
        if (!formData.customer || !formData.branch_id || !formData.exicutive_name) {
          toast.error('Please fill Customer Name, Branch, and Executive Name');
          return false;
        }
        // ✅ REMOVED: Aadhaar, PAN, mobile, email, and file requirements (now optional)
        break;
      case 3:
        // ✅ UPDATED: Only registration_number and product are required
        if (!formData.registration_number || !formData.product) {
          toast.error('Please fill Product and Registration Number');
          return false;
        }
        break;
      case 4:
        // ✅ Premium details are mostly optional now
        // No strict validation needed
        break;
      case 5:
        // ✅ UPDATED: Only premium_amount and payment_status required
        if (!formData.premium_amount || !formData.customer_payment_status) {
          toast.error('Please fill Premium Amount and Payment Status');
          return false;
        }
        break;
      case 6:
        // ✅ UPDATED: Company payment fields are optional
        // No strict validation needed
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
      // Create FormData for file uploads
      const submitData = new FormData();

      // ✅ Collect other_documents labels separately
      const otherDocLabels: string[] = [];

      // Append all fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        // ✅ Handle Aadhaar file
        if (key === 'adh_file') {
          if (value instanceof File) {
            submitData.append('adh_file', value);
          }
          return;
        }

        // ✅ Handle PAN file
        if (key === 'pan_file') {
          if (value instanceof File) {
            submitData.append('pan_file', value);
          }
          return;
        }

        // ✅ Handle other_documents - send as separate fields
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

        // ✅ Handle arrays (stringify them)
        if (key === 'addon_coverage' || key === 'payment_details') {
          submitData.append(key, JSON.stringify(value));
          return;
        }

        // ✅ Handle regular fields
        if (typeof value === 'object') {
          submitData.append(key, JSON.stringify(value));
        } else {
          submitData.append(key, String(value));
        }
      });

      // ✅ Append other_doc_labels as JSON array
      if (otherDocLabels.length > 0) {
        submitData.append('other_doc_labels', JSON.stringify(otherDocLabels));
      }

      // Debug: Log what we're sending
      console.log('📤 Submitting policy with fields:');
      for (const [key, value] of submitData.entries()) {
        if (value instanceof File) {
          console.log(`   ${key}: [File] ${value.name}`);
        } else {
          console.log(`   ${key}: ${value}`);
        }
      }

      // Submit to backend
      const response = await apiClient.post('/api/v1/policies', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Policy created successfully!');
      resetForm();
      router.push('/policies');
    } catch (error: any) {
      console.error('Submit error:', error);
      const message = error?.response?.data?.message || 'Failed to create policy';
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Policy</h1>
        <p className="text-gray-600 mt-1">Step {currentStep} of 6</p>
      </div>

      <PolicyWizard currentStep={currentStep}>
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <Button variant="ghost" onClick={handlePrevious} disabled={currentStep === 1}>
            ← Previous
          </Button>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                if (confirm('Are you sure? All progress will be lost.')) {
                  resetForm();
                  router.push('/policies');
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
                {isSubmitting ? 'Creating Policy...' : 'Create Policy'}
              </Button>
            )}
          </div>
        </div>
      </PolicyWizard>
    </div>
  );
}

export default function NewPolicyPage() {
  return (
    <PolicyFormProvider>
      <NewPolicyFormContent />
    </PolicyFormProvider>
  );
}
