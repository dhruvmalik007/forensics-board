'use client';

import React from 'react';
import { ExternalLink, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

type AddressDetails = {
  address: string;
  type: 'main' | 'alt_wallet' | 'cex' | 'defi' | 'bridge' | 'mixer' | 'contract' | 'flagged';
  tags: {
    name: string;
    source: 'custom' | 'etherscan' | 'arkham' | 'chainalysis' | 'community';
  }[];
  transactions: {
    id: string;
    hash: string;
    timestamp: Date;
    from: string;
    to: string;
    value: string;
    asset: string;
    direction: 'incoming' | 'outgoing';
  }[];
  balance?: {
    asset: string;
    value: string;
  }[];
  firstSeen?: Date;
  lastSeen?: Date;
  riskScore?: number;
};

type DetailsViewProps = {
  addressDetails?: AddressDetails;
  selectedAddress?: string;
};

export function DetailsView({ addressDetails, selectedAddress }: DetailsViewProps) {
  if (!selectedAddress || !addressDetails) {
    return (
      <div className="text-gray-400 text-center p-4">
        Select an address from the graph to view details
      </div>
    );
  }

  // Function to copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In a real app, you would show a toast notification here
  };

  // Function to open address in block explorer
  const openInExplorer = (address: string) => {
    window.open(`https://etherscan.io/address/${address}`, '_blank');
  };

  // Function to format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

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

  // Get source color
  const getSourceColor = (source: string) => {
    const sourceColors = {
      custom: 'bg-purple-500',
      etherscan: 'bg-blue-500',
      arkham: 'bg-green-500',
      chainalysis: 'bg-yellow-500',
      community: 'bg-orange-500'
    };
    return sourceColors[source as keyof typeof sourceColors] || 'bg-gray-500';
  };

  return (
    <div className="text-sm">
      {/* Address header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${getTypeColor(addressDetails.type)} mr-2`}></div>
            <h3 className="font-medium truncate" title={addressDetails.address}>
              {addressDetails.address.substring(0, 8)}...{addressDetails.address.substring(addressDetails.address.length - 6)}
            </h3>
          </div>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => copyToClipboard(addressDetails.address)}
              title="Copy address"
            >
              <Copy size={14} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => openInExplorer(addressDetails.address)}
              title="View on Etherscan"
            >
              <ExternalLink size={14} />
            </Button>
          </div>
        </div>
        
        {/* Tags */}
        {addressDetails.tags && addressDetails.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {addressDetails.tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className={`text-xs ${getSourceColor(tag.source)} bg-opacity-20 border-none text-white`}
              >
                {tag.name}
                <span className="ml-1 text-xs opacity-60">({tag.source})</span>
              </Badge>
            ))}
          </div>
        )}
        
        {/* Risk score if available */}
        {addressDetails.riskScore !== undefined && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Risk Score</div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  addressDetails.riskScore > 70 ? 'bg-red-500' : 
                  addressDetails.riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${addressDetails.riskScore}%` }}
              ></div>
            </div>
            <div className="text-xs mt-1 text-right">{addressDetails.riskScore}/100</div>
          </div>
        )}
      </div>
      
      {/* Balance section */}
      {addressDetails.balance && addressDetails.balance.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs uppercase text-gray-400 mb-2">Balance</h4>
          <div className="space-y-1">
            {addressDetails.balance.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.asset}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Activity section */}
      <div className="mb-4">
        <h4 className="text-xs uppercase text-gray-400 mb-2">Activity</h4>
        <div className="grid grid-cols-2 gap-2">
          {addressDetails.firstSeen && (
            <div>
              <div className="text-xs text-gray-400">First Seen</div>
              <div>{formatDate(addressDetails.firstSeen)}</div>
            </div>
          )}
          {addressDetails.lastSeen && (
            <div>
              <div className="text-xs text-gray-400">Last Seen</div>
              <div>{formatDate(addressDetails.lastSeen)}</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Recent transactions */}
      {addressDetails.transactions && addressDetails.transactions.length > 0 && (
        <div>
          <h4 className="text-xs uppercase text-gray-400 mb-2">Recent Transactions</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {addressDetails.transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="bg-gray-700 p-2 rounded text-xs">
                <div className="flex justify-between mb-1">
                  <span className={tx.direction === 'incoming' ? 'text-green-400' : 'text-red-400'}>
                    {tx.direction === 'incoming' ? 'IN' : 'OUT'}
                  </span>
                  <span className="text-gray-400">{formatDate(tx.timestamp)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="truncate max-w-[120px]" title={tx.hash}>
                    {tx.hash.substring(0, 8)}...
                  </span>
                  <span className="font-medium">{tx.value} {tx.asset}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span className="truncate max-w-[120px]" title={tx.from}>
                    From: {tx.from.substring(0, 6)}...
                  </span>
                  <span className="truncate max-w-[120px]" title={tx.to}>
                    To: {tx.to.substring(0, 6)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
