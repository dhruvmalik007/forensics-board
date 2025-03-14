'use client';

import React from 'react';
import { Button } from '../ui/button';

type AddressListProps = {
  addresses: {
    address: string;
    type: 'main' | 'alt_wallet' | 'cex' | 'defi' | 'bridge' | 'mixer' | 'contract' | 'flagged';
    tags: string[];
  }[];
  selectedAddress?: string;
  onAddressSelect: (address: string) => void;
};

export function AddressList({ addresses, selectedAddress, onAddressSelect }: AddressListProps) {
  // Get type color
  const getTypeColor = (type: string) => {
    const typeColors = {
      main: 'bg-indigo-500',
      alt_wallet: 'bg-amber-500',
      cex: 'bg-emerald-500',
      defi: 'bg-cyan-500',
      bridge: 'bg-violet-500',
      mixer: 'bg-rose-500',
      contract: 'bg-slate-500',
      flagged: 'bg-red-500'
    };
    return typeColors[type as keyof typeof typeColors] || 'bg-gray-500';
  };

  if (addresses.length === 0) {
    return (
      <div className="text-gray-400 text-center p-4">
        No addresses found
      </div>
    );
  }

  return (
    <div className="space-y-1 overflow-y-auto">
      {addresses.map((addr) => (
        <Button
          key={addr.address}
          variant="ghost"
          className={`w-full justify-start px-2 py-1 h-auto text-sm ${
            selectedAddress === addr.address ? 'bg-gray-700' : ''
          }`}
          onClick={() => onAddressSelect(addr.address)}
        >
          <div className="flex items-center w-full">
            <div className={`w-2 h-2 rounded-full ${getTypeColor(addr.type)} mr-2`}></div>
            <span className="truncate">
              {addr.address.substring(0, 8)}...{addr.address.substring(addr.address.length - 6)}
            </span>
          </div>
        </Button>
      ))}
    </div>
  );
}
