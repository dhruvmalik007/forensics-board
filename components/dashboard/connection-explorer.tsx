import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, AlertCircle, Search, ArrowRight, ExternalLink } from 'lucide-react';

type ConnectionData = {
  source: string;
  target: string;
  type: 'direct' | 'indirect';
  transactionCount: number;
  totalValue: number;
  lastTransaction: string; // ISO date string
};

export function ConnectionExplorer() {
  const [sourceAddress, setSourceAddress] = useState('');
  const [targetAddress, setTargetAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectionData[]>([]);
  const [activeTab, setActiveTab] = useState('direct');
  
  const handleExplore = async () => {
    if (!sourceAddress.startsWith('0x')) {
      setError('Please enter a valid source address starting with 0x');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate the API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data for demonstration
      const mockConnections: ConnectionData[] = [
        { 
          source: sourceAddress, 
          target: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 
          type: 'direct',
          transactionCount: 12,
          totalValue: 5.75,
          lastTransaction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        { 
          source: sourceAddress, 
          target: '0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8', 
          type: 'direct',
          transactionCount: 5,
          totalValue: 2.3,
          lastTransaction: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        { 
          source: sourceAddress, 
          target: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30', 
          type: 'indirect',
          transactionCount: 3,
          totalValue: 1.2,
          lastTransaction: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        { 
          source: sourceAddress, 
          target: '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E', 
          type: 'indirect',
          transactionCount: 1,
          totalValue: 0.5,
          lastTransaction: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
      ];
      
      // If target address is provided, filter connections
      if (targetAddress) {
        const filtered = mockConnections.filter(conn => 
          conn.target.toLowerCase() === targetAddress.toLowerCase()
        );
        setConnections(filtered);
        
        if (filtered.length === 0) {
          setError('No connections found between these addresses');
        }
      } else {
        setConnections(mockConnections);
      }
    } catch (err) {
      setError('Failed to explore connections. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter connections based on active tab
  const filteredConnections = connections.filter(conn => 
    activeTab === 'all' || conn.type === activeTab
  );
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Connection Explorer</CardTitle>
        <CardDescription>
          Explore direct and indirect connections between blockchain addresses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="source-address" className="text-sm font-medium block mb-1">
                Source Address
              </label>
              <Input
                id="source-address"
                placeholder="0x..."
                value={sourceAddress}
                onChange={(e) => setSourceAddress(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="target-address" className="text-sm font-medium block mb-1">
                Target Address (Optional)
              </label>
              <Input
                id="target-address"
                placeholder="0x..."
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleExplore} 
            disabled={isLoading || !sourceAddress}
            className="w-full"
          >
            {isLoading ? 'Exploring...' : 'Explore Connections'}
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
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-[200px] w-full rounded-md" />
            </div>
          ) : connections.length > 0 ? (
            <div className="space-y-4 py-4">
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="direct">Direct</TabsTrigger>
                  <TabsTrigger value="indirect">Indirect</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  <ConnectionList connections={filteredConnections} />
                </TabsContent>
                
                <TabsContent value="direct" className="mt-4">
                  <ConnectionList connections={filteredConnections} />
                </TabsContent>
                
                <TabsContent value="indirect" className="mt-4">
                  <ConnectionList connections={filteredConnections} />
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <InfoIcon className="h-4 w-4 mr-1" />
          Connections are based on on-chain transaction history
        </div>
        <Button variant="outline" size="sm" onClick={() => window.open('https://etherscan.io', '_blank')}>
          View on Etherscan
        </Button>
      </CardFooter>
    </Card>
  );
}

function ConnectionList({ connections }: { connections: ConnectionData[] }) {
  if (connections.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No connections found for the selected filter
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {connections.map((connection, index) => (
        <ConnectionCard key={index} connection={connection} />
      ))}
    </div>
  );
}

function ConnectionCard({ connection }: { connection: ConnectionData }) {
  const lastTxDate = new Date(connection.lastTransaction);
  const daysAgo = Math.floor((Date.now() - lastTxDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="font-medium">{connection.source.substring(0, 6)}...{connection.source.substring(connection.source.length - 4)}</span>
          <ArrowRight className="h-4 w-4 mx-2" />
          <span className="font-medium">{connection.target.substring(0, 6)}...{connection.target.substring(connection.target.length - 4)}</span>
        </div>
        <Badge variant={connection.type === 'direct' ? 'default' : 'outline'}>
          {connection.type === 'direct' ? 'Direct' : 'Indirect'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <div className="text-muted-foreground">Transactions</div>
          <div className="font-medium">{connection.transactionCount}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Total Value</div>
          <div className="font-medium">{connection.totalValue} ETH</div>
        </div>
        <div>
          <div className="text-muted-foreground">Last Transaction</div>
          <div className="font-medium">{daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}</div>
        </div>
      </div>
      
      <div className="mt-2 flex justify-end">
        <Button variant="ghost" size="sm" className="h-7 px-2">
          <Search className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">View Transactions</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2">
          <ExternalLink className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">View on Explorer</span>
        </Button>
      </div>
    </div>
  );
} 