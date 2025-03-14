'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export type AddressDetails = {
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
};

type DetailsListViewProps = {
  addresses: {
    address: string;
    type: 'main' | 'alt_wallet' | 'cex' | 'defi' | 'bridge' | 'mixer' | 'contract' | 'flagged';
    tags: string[];
  }[];
  selectedAddress?: string;
  addressDetails?: AddressDetails;
  onAddressSelect: (address: string) => void;
  onRunStrategy: (address: string, strategyIds: string[]) => void;
};

export function DetailsListView({
  addresses,
  selectedAddress,
  addressDetails,
  onAddressSelect,
  onRunStrategy,
}: DetailsListViewProps) {
  const [sortField, setSortField] = useState<'address' | 'type'>('address');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [listExpanded, setListExpanded] = useState(true);
  
  const handleSort = (field: 'address' | 'type') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const sortedAddresses = [...addresses].sort((a, b) => {
    if (sortField === 'address') {
      return sortDirection === 'asc'
        ? a.address.localeCompare(b.address)
        : b.address.localeCompare(a.address);
    } else {
      return sortDirection === 'asc'
        ? a.type.localeCompare(b.type)
        : b.type.localeCompare(a.type);
    }
  });
  
  const filteredAddresses = filterType
    ? sortedAddresses.filter(a => a.type === filterType)
    : sortedAddresses;
  
  const getAddressTypeLabel = (type: string) => {
    switch (type) {
      case 'main': return 'Main';
      case 'alt_wallet': return 'Alt Wallet (?)';
      case 'cex': return 'CEX';
      case 'defi': return 'DeFi';
      case 'bridge': return 'Bridge';
      case 'mixer': return 'Mixer';
      case 'contract': return 'Contract';
      case 'flagged': return 'Flagged';
      default: return type;
    }
  };
  
  const getAddressTypeColor = (type: string) => {
    switch (type) {
      case 'main': return 'bg-indigo-900 text-indigo-200';
      case 'alt_wallet': return 'bg-amber-900 text-amber-200';
      case 'cex': return 'bg-emerald-900 text-emerald-200';
      case 'defi': return 'bg-blue-900 text-blue-200';
      case 'bridge': return 'bg-violet-900 text-violet-200';
      case 'mixer': return 'bg-red-900 text-red-200';
      case 'contract': return 'bg-gray-700 text-gray-200';
      case 'flagged': return 'bg-red-950 text-red-200';
      default: return 'bg-gray-700 text-gray-200';
    }
  };
  
  const getTagSourceColor = (source: string) => {
    switch (source) {
      case 'custom': return 'bg-blue-900 text-blue-200';
      case 'etherscan': return 'bg-purple-900 text-purple-200';
      case 'arkham': return 'bg-green-900 text-green-200';
      case 'chainalysis': return 'bg-orange-900 text-orange-200';
      case 'community': return 'bg-teal-900 text-teal-200';
      default: return 'bg-gray-700 text-gray-200';
    }
  };
  
  const handleRunAllStrategies = () => {
    if (selectedAddress) {
      onRunStrategy(selectedAddress, ['token_transfers', 'nft_transfers', 'bidirectional', 'funding', 'bridging', 'lp_analysis']);
    }
  };
  
  return (
    <div className="bg-gray-900 rounded-lg h-full flex flex-col">
      {/* Address Details Section */}
      <div className="border-b border-gray-800">
        <div 
          className="px-4 py-3 flex justify-between items-center cursor-pointer"
          onClick={() => setDetailsExpanded(prev => !prev)}
        >
          <h2 className="font-semibold">Address Details</h2>
          <button className="text-gray-400 hover:text-white">
            {detailsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
        
        {detailsExpanded && (
          <div className="p-4">
            {selectedAddress && addressDetails ? (
              <div>
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-sm text-gray-400">Address</h3>
                      <p className="font-mono text-sm break-all">{addressDetails.address}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${getAddressTypeColor(addressDetails.type)}`}>
                      {getAddressTypeLabel(addressDetails.type)}
                    </div>
                  </div>
                  
                  {addressDetails.tags.length > 0 && (
                    <div className="mb-2">
                      <h3 className="font-medium text-sm text-gray-400 mb-1">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {addressDetails.tags.map((tag, index) => (
                          <div 
                            key={index}
                            className={`px-2 py-1 rounded text-xs flex items-center ${getTagSourceColor(tag.source)}`}
                          >
                            <span>{tag.name}</span>
                            <span className="ml-1 opacity-70 text-[10px]">({tag.source})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleRunAllStrategies}
                    >
                      Run All Strategies
                    </Button>
                    <a 
                      href={`https://etherscan.io/address/${addressDetails.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <ExternalLink size={14} />
                        Etherscan
                      </Button>
                    </a>
                  </div>
                </div>
                
                <Tabs defaultValue="transactions">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="tokens">Tokens</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="transactions" className="mt-2">
                    {addressDetails.transactions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-800">
                              <th className="text-left py-2 px-2">Hash</th>
                              <th className="text-left py-2 px-2">Time</th>
                              <th className="text-left py-2 px-2">Direction</th>
                              <th className="text-right py-2 px-2">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {addressDetails.transactions.map(tx => (
                              <tr key={tx.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                <td className="py-2 px-2">
                                  <a 
                                    href={`https://etherscan.io/tx/${tx.hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline font-mono text-xs"
                                  >
                                    {tx.hash.substring(0, 8)}...{tx.hash.substring(tx.hash.length - 6)}
                                  </a>
                                </td>
                                <td className="py-2 px-2 text-xs text-gray-400">
                                  {tx.timestamp.toLocaleString()}
                                </td>
                                <td className="py-2 px-2">
                                  <span className={`px-2 py-0.5 rounded text-xs ${
                                    tx.direction === 'incoming' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                                  }`}>
                                    {tx.direction === 'incoming' ? 'IN' : 'OUT'}
                                  </span>
                                </td>
                                <td className="py-2 px-2 text-right">
                                  <div className="font-medium">{tx.value}</div>
                                  <div className="text-xs text-gray-400">{tx.asset}</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        No transactions found for this address
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="tokens" className="mt-2">
                    <div className="text-center py-4 text-gray-400 text-sm">
                      Token information will be displayed here
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Select an address to view details</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Address List Section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div 
          className="px-4 py-3 flex justify-between items-center cursor-pointer border-b border-gray-800"
          onClick={() => setListExpanded(prev => !prev)}
        >
          <h2 className="font-semibold">Address List</h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0"
                aria-label="Filter"
              >
                <Filter size={16} />
              </Button>
              
              {/* Filter dropdown would go here */}
            </div>
            <button className="text-gray-400 hover:text-white">
              {listExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>
        
        {listExpanded && (
          <div className="flex-1 overflow-y-auto">
            {filteredAddresses.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="border-b border-gray-800">
                    <th 
                      className="text-left py-2 px-4 cursor-pointer hover:bg-gray-800/50"
                      onClick={() => handleSort('address')}
                    >
                      <div className="flex items-center">
                        <span>Address</span>
                        {sortField === 'address' && (
                          <ArrowUpDown size={14} className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-2 px-4 cursor-pointer hover:bg-gray-800/50"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center">
                        <span>Type</span>
                        {sortField === 'type' && (
                          <ArrowUpDown size={14} className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="text-left py-2 px-4">Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAddresses.map(address => (
                    <tr 
                      key={address.address}
                      className={`border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer ${
                        address.address === selectedAddress ? 'bg-gray-800' : ''
                      }`}
                      onClick={() => onAddressSelect(address.address)}
                    >
                      <td className="py-2 px-4 font-mono text-xs">
                        {address.address.substring(0, 8)}...{address.address.substring(address.address.length - 6)}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs ${getAddressTypeColor(address.type)}`}>
                          {getAddressTypeLabel(address.type)}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        {address.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {address.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-0.5 rounded text-xs bg-gray-700">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No addresses found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
