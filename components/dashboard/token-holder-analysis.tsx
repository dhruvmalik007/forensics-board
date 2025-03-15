import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart } from '@/components/ui/pie-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, AlertCircle } from 'lucide-react';

type TokenHolderData = {
  address: string;
  balance: number;
  percentage: number;
  type: 'whale' | 'contract' | 'exchange' | 'regular';
};

export function TokenHolderAnalysis() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holders, setHolders] = useState<TokenHolderData[]>([]);
  
  const handleAnalyze = async () => {
    if (!tokenAddress.startsWith('0x')) {
      setError('Please enter a valid token address starting with 0x');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate the API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data for demonstration
      const mockHolders: TokenHolderData[] = [
        { address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', balance: 1000000, percentage: 25, type: 'whale' },
        { address: '0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8', balance: 800000, percentage: 20, type: 'exchange' },
        { address: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30', balance: 600000, percentage: 15, type: 'contract' },
        { address: '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E', balance: 400000, percentage: 10, type: 'regular' },
        { address: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0', balance: 300000, percentage: 7.5, type: 'regular' },
        { address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', balance: 200000, percentage: 5, type: 'regular' },
        { address: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0', balance: 700000, percentage: 17.5, type: 'regular' },
      ];
      
      setHolders(mockHolders);
    } catch (err) {
      setError('Failed to analyze token holders. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Prepare data for pie chart
  const chartData = {
    labels: holders.map(h => h.address.substring(0, 6) + '...' + h.address.substring(h.address.length - 4)),
    datasets: [
      {
        data: holders.map(h => h.percentage),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8AC926'
        ],
        borderWidth: 1
      }
    ]
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Token Holder Analysis</CardTitle>
        <CardDescription>
          Analyze the distribution of token holders for any ERC-20 or ERC-721 token
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <label htmlFor="token-address" className="text-sm font-medium block mb-1">
                Token Address
              </label>
              <Input
                id="token-address"
                placeholder="0x..."
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="chain-select" className="text-sm font-medium block mb-1">
                Blockchain
              </label>
              <Select value={chain} onValueChange={setChain}>
                <SelectTrigger id="chain-select">
                  <SelectValue placeholder="Select blockchain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="bsc">BSC</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={handleAnalyze} 
            disabled={isLoading || !tokenAddress}
            className="w-full"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Token Holders'}
          </Button>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-[300px] w-full rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ) : holders.length > 0 ? (
            <div className="space-y-6 py-4">
              <div className="h-[300px] flex justify-center">
                <PieChart data={chartData} />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Top Token Holders</h3>
                <div className="space-y-2">
                  {holders.map((holder, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                      <div>
                        <span className="font-medium">{holder.address.substring(0, 6)}...{holder.address.substring(holder.address.length - 4)}</span>
                        <span className="ml-2 text-xs px-2 py-1 rounded-full bg-muted">
                          {holder.type === 'whale' ? '🐋 Whale' : 
                           holder.type === 'contract' ? '📄 Contract' : 
                           holder.type === 'exchange' ? '💱 Exchange' : '👤 Regular'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{holder.balance.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{holder.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <InfoIcon className="h-4 w-4 mr-1" />
          Data is sourced from on-chain transactions
        </div>
        <Button variant="outline" size="sm" onClick={() => window.open('https://etherscan.io/tokens', '_blank')}>
          View on Etherscan
        </Button>
      </CardFooter>
    </Card>
  );
} 