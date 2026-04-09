'use client';

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
  onStepClick?: (step: number) => void;
  children: React.ReactNode;
}

export function PolicyWizard({ currentStep, onStepClick, children }: PolicyWizardProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Progress Steps */}
      <div className="w-full lg:w-64 flex-shrink-0">
        <nav aria-label="Progress">
          <ol className="overflow-hidden">
            {steps.map((step, stepIdx) => (
              <li
                key={step.id}
                className={clsx('relative', stepIdx !== steps.length - 1 ? 'pb-10' : '')}
              >
                {/* Connector Line */}
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true">
                    <div
                      className={clsx(
                        'w-full transition-all duration-300',
                        currentStep > step.id ? 'bg-primary h-full' : 'bg-transparent h-0'
                      )}
                    />
                  </div>
                )}

                {/* Step Circle & Text */}
                <div 
                  className={clsx("relative flex items-start group", onStepClick && "cursor-pointer")}
                  onClick={() => onStepClick && onStepClick(step.id)}
                >
                  <span className="flex h-9 items-center">
                    <span
                      className={clsx(
                        'relative z-10 w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all duration-200',
                        currentStep > step.id
                          ? 'border-slate-800 bg-slate-800'
                          : currentStep === step.id
                            ? 'border-slate-800 bg-slate-800 shadow-[0_0_0_4px_rgba(148,163,184,0.12)]'
                            : 'border-slate-300 bg-[rgba(239,245,253,0.88)] group-hover:border-slate-400'
                      )}
                    >
                      {currentStep > step.id ? (
                        <CheckIcon className="w-5 h-5 text-white" />
                      ) : (
                        <span className={clsx("text-xs font-semibold", currentStep === step.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-700')}>{step.id}</span>
                      )}
                    </span>
                  </span>
                  <span className="ml-4 min-w-0 flex flex-col">
                    <span
                      className={clsx(
                        'text-sm font-semibold uppercase tracking-tight transition-colors',
                        currentStep >= step.id ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'
                      )}
                    >
                      {step.title}
                    </span>
                    <span className="text-sm text-slate-500">{step.description}</span>
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Main Form Content */}
      <div className="glass-panel-strong flex-1 min-w-0 rounded-[22px]">
        <div className="border-b border-slate-200/80 p-6">
          <h2 className="text-xl font-bold text-slate-900">{steps[currentStep - 1]?.title}</h2>
          <p className="text-sm text-slate-500 mt-1">{steps[currentStep - 1]?.description}</p>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
