import React from 'react';
import { Stepper, Step, StepStatus } from '@/components/ui/stepper';
import { StreamingLog } from '@/components/ui/streaming-log';
import { cn } from '@/lib/utils';

export interface ProcessStep {
  id: string;
  title: string;
  description?: string;
}

export interface ProcessViewerProps {
  steps: ProcessStep[];
  currentStepId: string;
  logs: string[];
  className?: string;
}

export function ProcessViewer({ steps, currentStepId, logs, className }: ProcessViewerProps) {
  // Convert steps to the format expected by the Stepper component
  const formattedSteps: Step[] = steps.map(step => {
    let status: StepStatus = 'pending';
    
    // Find the index of the current step
    const currentStepIndex = steps.findIndex(s => s.id === currentStepId);
    const stepIndex = steps.findIndex(s => s.id === step.id);
    
    // Determine the status based on the step's position relative to the current step
    if (stepIndex < currentStepIndex) {
      status = 'completed';
    } else if (stepIndex === currentStepIndex) {
      status = 'in-progress';
    } else {
      status = 'pending';
    }
    
    return {
      ...step,
      status,
    };
  });
  
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-6', className)}>
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">Exploration Process</h3>
        <Stepper steps={formattedSteps} currentStepId={currentStepId} />
      </div>
      
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">Process Logs</h3>
        <StreamingLog logs={logs} maxHeight="400px" />
      </div>
    </div>
  );
}

// Define the default steps for blockchain exploration
export const defaultBlockchainExplorationSteps: ProcessStep[] = [
  {
    id: 'understanding',
    title: 'Understanding Query',
    description: 'Parsing and analyzing the blockchain query',
  },
  {
    id: 'searching',
    title: 'Searching Blockchain Explorer',
    description: 'Connecting to blockchain explorers and searching for data',
  },
  {
    id: 'crosschain',
    title: 'Cross-Chain Analysis',
    description: 'Analyzing transactions across multiple blockchains',
  },
  {
    id: 'fetching',
    title: 'Fetching Transaction Data',
    description: 'Retrieving detailed transaction information',
  },
  {
    id: 'processing',
    title: 'Processing Results',
    description: 'Organizing and analyzing the transaction data',
  },
  {
    id: 'rendering',
    title: 'Rendering Results',
    description: 'Preparing the final visualization of blockchain data',
  },
]; 