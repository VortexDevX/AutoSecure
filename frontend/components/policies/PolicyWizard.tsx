'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { CheckIcon } from '@heroicons/react/24/solid';

interface Step {
  id: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  { id: 1, title: 'Policy Details', description: 'Basic policy information' },
  { id: 2, title: 'Customer Details', description: 'Customer & documents' },
  { id: 3, title: 'Vehicle Details', description: 'Vehicle information' },
  { id: 4, title: 'Premium Details', description: 'Premium & coverage' },
  { id: 5, title: 'Payment Details', description: 'Customer payment' },
  { id: 6, title: 'Review & Submit', description: 'Company payment & review' },
];

interface PolicyWizardProps {
  currentStep: number;
  children: React.ReactNode;
}

export function PolicyWizard({ currentStep, children }: PolicyWizardProps) {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {steps.map((step, stepIdx) => (
              <li
                key={step.id}
                className={clsx(
                  'relative',
                  stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''
                )}
              >
                {/* Connector Line */}
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div
                      className={clsx(
                        'h-0.5 w-full',
                        currentStep > step.id ? 'bg-primary' : 'bg-gray-200'
                      )}
                    />
                  </div>
                )}

                {/* Step Circle */}
                <div className="relative flex flex-col items-center group">
                  <span
                    className={clsx(
                      'w-10 h-10 flex items-center justify-center rounded-full border-2 transition-colors',
                      currentStep > step.id
                        ? 'bg-primary border-primary'
                        : currentStep === step.id
                          ? 'bg-white border-primary text-primary'
                          : 'bg-white border-gray-300 text-gray-500'
                    )}
                  >
                    {currentStep > step.id ? (
                      <CheckIcon className="w-6 h-6 text-white" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </span>
                  <span
                    className={clsx(
                      'mt-2 text-xs font-medium text-center',
                      currentStep >= step.id ? 'text-primary' : 'text-gray-500'
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{steps[currentStep - 1]?.title}</h2>
          <p className="text-sm text-gray-600 mt-1">{steps[currentStep - 1]?.description}</p>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
