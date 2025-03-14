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
import { Share2, Download, ExternalLink, Copy, AlertTriangle } from 'lucide-react';

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
      // Instead of using mock data, set result to null to show error state
      setResult(null);
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
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">Error</h3>
        </div>
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <p className="mt-2 text-sm text-red-600 dark:text-red-300">
          Unable to fetch transaction data. Please check the address and try again.
        </p>
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
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Transaction Data Available</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We couldn't find any transaction data for the provided address on this chain.
          </p>
          <Button
            variant="outline"
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </div>
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
              {transactions.length === 0 ? (
                <div className="text-center p-4 text-gray-500">
                  No transactions found for this address.
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 