import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

export type StepStatus = 'pending' | 'in-progress' | 'completed' | 'error';

export interface Step {
  id: string;
  title: string;
  description?: string;
  status: StepStatus;
}

interface StepperProps {
  steps: Step[];
  currentStepId?: string;
  className?: string;
}

export function Stepper({ steps, currentStepId, className }: StepperProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full">
              {step.status === 'completed' ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : step.status === 'in-progress' ? (
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              ) : step.status === 'error' ? (
                <Circle className="h-8 w-8 text-red-500" />
              ) : (
                <Circle className="h-8 w-8 text-gray-300 dark:text-gray-600" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div className="h-10 w-px bg-gray-300 dark:bg-gray-600" />
            )}
          </div>
          <div className="flex flex-col space-y-1 pb-8">
            <div className="flex items-center gap-2">
              <h3 
                className={cn(
                  "font-medium",
                  step.status === 'completed' && "text-green-500",
                  step.status === 'in-progress' && "text-blue-500",
                  step.status === 'error' && "text-red-500",
                  step.status === 'pending' && "text-gray-500 dark:text-gray-400"
                )}
              >
                {step.title}
              </h3>
              {step.status === 'in-progress' && (
                <span className="text-xs text-blue-500 animate-pulse">In progress...</span>
              )}
            </div>
            {step.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {step.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 