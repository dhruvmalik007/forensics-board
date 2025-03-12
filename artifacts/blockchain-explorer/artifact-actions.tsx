'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share2, Download, RefreshCw, Maximize2, BarChart } from 'lucide-react';

export default function BlockchainExplorerArtifactActions({
  inputs,
  updateInputs,
}: {
  inputs: {
    address: string;
    chain: string;
  };
  updateInputs: (inputs: any) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localInputs, setLocalInputs] = useState(inputs);

  const chains = [
    { id: 'ethereum', name: 'Ethereum' },
    { id: 'binance', name: 'Binance Smart Chain' },
    { id: 'polygon', name: 'Polygon' },
    { id: 'arbitrum', name: 'Arbitrum' },
    { id: 'optimism', name: 'Optimism' },
    { id: 'avalanche', name: 'Avalanche' },
    { id: 'fantom', name: 'Fantom' },
    { id: 'base', name: 'Base' },
    { id: 'zksync', name: 'zkSync Era' },
    { id: 'linea', name: 'Linea' },
    { id: 'scroll', name: 'Scroll' },
  ];

  const handleSubmit = () => {
    updateInputs(localInputs);
    setIsModalOpen(false);
  };

  const handleDownload = () => {
    // Create CSV of transaction data
    alert('Download functionality will be implemented in a future update');
  };

  const handleShare = () => {
    // Copy shareable link to clipboard
    navigator.clipboard.writeText(
      `${window.location.origin}/share?address=${inputs.address}&chain=${inputs.chain}`
    );
    alert('Shareable link copied to clipboard');
  };

  return (
    <div className="flex items-center space-x-2">
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Update
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Transaction Search</DialogTitle>
            <DialogDescription>
              Enter a wallet address and select a blockchain to analyze transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Input
                id="address"
                value={localInputs.address}
                onChange={(e) => setLocalInputs({ ...localInputs, address: e.target.value })}
                className="col-span-3"
                placeholder="0x..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="chain" className="text-right">
                Blockchain
              </Label>
              <Select
                value={localInputs.chain}
                onValueChange={(value) => setLocalInputs({ ...localInputs, chain: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select blockchain" />
                </SelectTrigger>
                <SelectContent>
                  {chains.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Button variant="outline" size="sm" onClick={handleDownload}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>
      
      <Button variant="outline" size="sm">
        <Maximize2 className="h-4 w-4 mr-2" />
        Fullscreen
      </Button>
      
      <Button variant="outline" size="sm">
        <BarChart className="h-4 w-4 mr-2" />
        Analytics
      </Button>
    </div>
  );
} 