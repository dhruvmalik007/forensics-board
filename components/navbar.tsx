'use client';

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { useModeStore } from '@/lib/stores/mode-store';

export function Navbar() {
  const { isLiveMode, toggleMode } = useModeStore();

  return (
    <div className="h-12 w-full bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center">
        <span className="text-xl font-semibold text-white">Forensics Board</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-300">Simulation</span>
        <Switch 
          checked={isLiveMode} 
          onCheckedChange={toggleMode}
          aria-label="Toggle live mode"
        />
        <span className="text-sm text-gray-300">Live Mode</span>
      </div>
    </div>
  );
}
