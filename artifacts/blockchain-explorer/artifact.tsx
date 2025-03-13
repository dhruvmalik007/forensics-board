'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Share2, Download, ExternalLink, Copy } from 'lucide-react';

interface Transaction {
  hash: string;
  timestamp: string;
  from: string;
  to: string;
  value: string;
  status: string;
}

interface ScrapingResult {
  transactions: Transaction[];
  summary: string;
}

export default function BlockchainExplorerArtifact({
  inputs,
}: {
  inputs: {
    address: string;
    chain: string;
  };
}) {
  const [result, setResult] = useState<ScrapingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');

  const { address, chain } = inputs;

  const fetchTransactions = useCallback(async () => {
    if (!address) {
      setError('No address provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/blockchain/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          chain,
          category: 'chain-explorer',
          limit: 20,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transaction data');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction data');
      // For demo purposes, use mock data when real API fails
      setResult({
        transactions: generateMockTransactions(address, chain),
        summary: generateMockSummary(address, chain),
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, chain]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  function truncateAddress(address: string) {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  const handleRefresh = () => {
    setIsLoading(true);
    fetchTransactions();
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">Error</h3>
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-4 text-center">
        <p>No transaction data available</p>
      </div>
    );
  }

  const { transactions, summary } = result;

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">
          Blockchain Transactions for{' '}
          <span className="font-mono">{truncateAddress(address)}</span> on{' '}
          <Badge variant="outline">{chain.charAt(0).toUpperCase() + chain.slice(1)}</Badge>
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => copyToClipboard(address)}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button size="sm" variant="outline">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{summary}</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="transactions" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hash</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.hash}>
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center">
                            {truncateAddress(tx.hash)}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-1 h-6 w-6"
                              onClick={() => copyToClipboard(tx.hash)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-1 h-6 w-6"
                              onClick={() => window.open(`https://${chain}.etherscan.io/tx/${tx.hash}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{tx.timestamp}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {truncateAddress(tx.from)}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-1 h-6 w-6"
                            onClick={() => copyToClipboard(tx.from)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {truncateAddress(tx.to)}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-1 h-6 w-6"
                            onClick={() => copyToClipboard(tx.to)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TableCell>
                        <TableCell>{tx.value}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              tx.status === 'Success'
                                ? 'default'
                                : tx.status === 'Pending'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {tx.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions for mock data
function generateMockTransactions(address: string, chain: string): Transaction[] {
  const transactions: Transaction[] = [];
  const statuses = ['Success', 'Pending', 'Failed'];
  
  for (let i = 0; i < 10; i++) {
    transactions.push({
      hash: `0x${Math.random().toString(16).substring(2, 42)}`,
      timestamp: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      from: i % 3 === 0 ? address : `0x${Math.random().toString(16).substring(2, 42)}`,
      to: i % 3 !== 0 ? address : `0x${Math.random().toString(16).substring(2, 42)}`,
      value: `${(Math.random() * 10).toFixed(4)} ${chain === 'ethereum' ? 'ETH' : chain.toUpperCase()}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
    });
  }
  
  return transactions;
}

function generateMockSummary(address: string, chain: string): string {
  const chainName = chain.charAt(0).toUpperCase() + chain.slice(1);
  return `Address ${address} on ${chainName} shows a pattern of regular activity over the past 30 days.

Key observations:
- 37 total transactions (23 outgoing, 14 incoming)
- Average transaction value: 0.85 ${chain === 'ethereum' ? 'ETH' : chain.toUpperCase()}
- Most frequent interaction: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D (Uniswap Router)
- Largest transaction: 12.5 ${chain === 'ethereum' ? 'ETH' : chain.toUpperCase()} received on ${new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0]}
- Has interacted with 14 unique addresses
- No suspicious patterns detected

The address appears to be actively trading on DEXes and occasionally transferring to/from centralized exchanges (Binance, Coinbase).`;
} 