'use client';

import { useState } from 'react';
import { Switch as HeadlessSwitch } from '@headlessui/react';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  'aria-label'?: string;
}

export function Switch({ 
  checked = false, 
  onCheckedChange, 
  className = '', 
  'aria-label': ariaLabel 
}: SwitchProps) {
  const [enabled, setEnabled] = useState(checked);
  
  const handleChange = (newChecked: boolean) => {
    setEnabled(newChecked);
    onCheckedChange?.(newChecked);
  };
  
  return (
    <HeadlessSwitch
      checked={enabled}
      onChange={handleChange}
      className={`${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      } relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      aria-label={ariaLabel}
    >
      <span
        className={`${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
      />
    </HeadlessSwitch>
  );
}
