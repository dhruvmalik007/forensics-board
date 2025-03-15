import React from 'react';
import { Button } from '@/components/ui/button';
import { NetworkIcon, LayersIcon } from 'lucide-react';

type ViewToggleProps = {
  activeView: 'graph' | 'features';
  onToggle: (view: 'graph' | 'features') => void;
};

export function ViewToggle({ activeView, onToggle }: ViewToggleProps) {
  return (
    <div className="flex items-center space-x-2 bg-muted rounded-lg p-1">
      <Button
        variant={activeView === 'graph' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onToggle('graph')}
        className="flex items-center"
      >
        <NetworkIcon className="h-4 w-4 mr-2" />
        Graph View
      </Button>
      <Button
        variant={activeView === 'features' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onToggle('features')}
        className="flex items-center"
      >
        <LayersIcon className="h-4 w-4 mr-2" />
        Features
      </Button>
    </div>
  );
} 