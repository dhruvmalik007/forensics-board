'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { SuggestedActions } from '@/components/suggested-actions';
import { nanoid } from 'nanoid';
import { useArtifact } from '@/hooks/use-artifact';
import { BlockchainExplorerScraper } from '@/packages/browser-scraping/src';
import { parseBlockchainQuery, isBlockchainQuery } from '@/lib/blockchain-query-parser';
import { Skeleton } from '@/components/ui/skeleton';
import BlockchainExplorerArtifactActions from '@/artifacts/blockchain-explorer/artifact-actions';
import { blockchainExplorerArtifact } from '@/artifacts/blockchain-explorer/client';
import { ProcessViewer, defaultBlockchainExplorationSteps } from '@/components/blockchain-explorer/process-viewer';
import { usePrivyAuthWithDB } from '@/hooks/use-privy-auth-with-db';
import { useBlockchainExploration } from '@/hooks/use-blockchain-exploration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Define types for the artifact
interface UIArtifact {
  title: string;
  documentId: string;
  kind: 'blockchain-explorer' | 'text' | 'code' | 'image' | 'sheet';
  content: string;
  isVisible: boolean;
  status: 'streaming' | 'idle';
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentIdParam = searchParams.get('documentId');
  const { user, logout } = usePrivyAuthWithDB();
  
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showArtifact, setShowArtifact] = useState(false);
  const [artifactData, setArtifactData] = useState<any>(null);
  const [blockchainResults, setBlockchainResults] = useState<any>(null);
  const [currentStepId, setCurrentStepId] = useState<string>('understanding');
  const [processLogs, setProcessLogs] = useState<string[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const chatId = nanoid();
  const { setArtifact } = useArtifact();
  
  // Check if we're in the browser
  useEffect(() => {
    setIsBrowser(true);
  }, []);
  
  // Create a state for artifacts since it's not provided by useArtifact
  const [artifacts, setArtifacts] = useState<UIArtifact[]>([]);
  
  // Find blockchain explorer artifact if it exists
  const blockchainArtifact = artifacts?.find((a) => a.kind === 'blockchain-explorer');
  
  // Get blockchain explorations using the hook
  const { explorations, currentExploration, getExplorations } = useBlockchainExploration({
    privyDID: user?.id || '',
  });
  
  // Check verification status
  useEffect(() => {
    if (!isBrowser) return;
    
    // Check if user is verified from localStorage
    const selfVerified = localStorage.getItem('selfVerified') === 'true';
    setIsVerified(selfVerified || user?.isVerified || false);
  }, [user, isBrowser]);
  
  // Load explorations when the component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      getExplorations();
    }
  }, [user?.id, getExplorations]);
  
  // Load the exploration data if documentId is provided
  useEffect(() => {
    if (documentIdParam && explorations.length > 0) {
      const exploration = explorations.find(e => e.documentId === documentIdParam);
      
      if (exploration) {
        // Create the artifact from the exploration data
        const newArtifact: UIArtifact = {
          title: `Blockchain Explorer: ${exploration.address ? exploration.address.substring(0, 8) : 'Query'}...`,
          documentId: exploration.documentId,
          kind: 'blockchain-explorer',
          content: exploration.results ? JSON.stringify(exploration.results) : '',
          isVisible: true,
          status: 'idle',
          boundingBox: {
            top: 0,
            left: 0,
            width: 0,
            height: 0
          }
        };
        
        // Add to local artifacts state if not already there
        setArtifacts(prev => {
          const exists = prev.some(a => a.documentId === exploration.documentId);
          if (exists) {
            return prev.map(a => a.documentId === exploration.documentId ? newArtifact : a);
          } else {
            return [...prev, newArtifact];
          }
        });
        
        // Also use the setArtifact from useArtifact
        setArtifact(newArtifact);
        
        // Set artifact data and results
        setArtifactData({
          address: exploration.address,
          chain: exploration.network,
          category: 'chain-explorer',
          documentId: exploration.documentId
        });
        
        if (exploration.results) {
          setBlockchainResults(exploration.results);
          setShowArtifact(true);
        }
      }
    }
  }, [documentIdParam, explorations, setArtifact]);
  
  // Update artifacts when a new one is created
  useEffect(() => {
    // Create a function to handle artifact creation
    const handleArtifactCreation = (artifact: UIArtifact) => {
      setArtifacts(prev => {
        const exists = prev.some(a => a.documentId === artifact.documentId);
        if (exists) {
          return prev.map(a => a.documentId === artifact.documentId ? artifact : a);
        } else {
          return [...prev, artifact];
        }
      });
    };

    // Return cleanup function
    return () => {
      // No cleanup needed
    };
  }, []);
  
  const handleStartSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    
    // Check if user is verified for premium features
    if (!isVerified && query.includes('premium')) {
      toast.error('This feature requires identity verification. Please verify your identity first.');
      return;
    }
    
    setIsLoading(true);
    setShowArtifact(false);
    setBlockchainResults(null);
    setCurrentStepId('understanding');
    setProcessLogs([]);
    
    try {
      // Create a new document ID for the artifact
      const documentId = nanoid();
      
      // Parse the blockchain query
      let address = '';
      let chain = 'ethereum';
      let category = 'chain-explorer';
      
      if (isBlockchainQuery(query)) {
        const params = parseBlockchainQuery(query);
        if (params) {
          address = params.address;
          chain = params.chain;
          category = params.category;
          toast.success('Blockchain query detected and parsed successfully');
          
          // Add to process logs
          setProcessLogs(prev => [...prev, `Blockchain query detected: ${address} on ${chain}`]);
        } else {
          toast.error('Could not parse blockchain address from query');
          setIsLoading(false);
          return;
        }
      } else {
        toast.error('Please enter a valid blockchain query with an address (0x...)');
        setIsLoading(false);
        return;
      }
      
      // Create the artifact
      const newArtifact: UIArtifact = {
        title: `Blockchain Explorer: ${address.substring(0, 8)}...`,
        documentId,
        kind: 'blockchain-explorer',
        content: '',
        isVisible: true,
        status: 'streaming',
        boundingBox: {
          top: 0,
          left: 0,
          width: 0,
          height: 0
        }
      };
      
      // Add to local artifacts state
      setArtifacts(prev => [...prev, newArtifact]);
      
      // Also use the setArtifact from useArtifact
      setArtifact(newArtifact);
      
      // Set initial artifact data
      setArtifactData({
        address,
        chain,
        category,
        documentId
      });
      
      // Create an AbortController to cancel the fetch if needed
      const controller = new AbortController();
      const { signal } = controller;
      
      // Create blockchain exploration in the database
      if (user?.id) {
        try {
          await fetch('/api/blockchain/exploration', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              privyDID: user.id,
              documentId,
              query,
              address,
              network: chain
            }),
          });
        } catch (error) {
          console.error('Error creating blockchain exploration in database:', error);
        }
      }
      
      // Start the blockchain data scraping process
      const response = await fetch('/api/artifacts/blockchain-explorer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: documentId,
          title: `Blockchain Explorer: ${address.substring(0, 8)}...`,
          address,
          chain,
          category,
          query
        }),
        signal,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch blockchain data');
      }
      
      // Process the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('Failed to read response stream');
      }
      
      // Update the current step
      setCurrentStepId('fetching');
      
      // Process the stream
      const processStream = async () => {
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          // Try to parse complete JSON objects from the buffer
          try {
            const result = JSON.parse(buffer);
            
            // Update the blockchain results
            setBlockchainResults(result);
            
            // Update the artifact content
            const updatedArtifact = {
              ...newArtifact,
              content: JSON.stringify(result),
              status: 'idle' as const,
            };
            
            // Update artifacts state
            setArtifacts(prev => 
              prev.map(a => a.documentId === documentId ? updatedArtifact : a)
            );
            
            // Also update the artifact using setArtifact
            setArtifact(updatedArtifact);
            
            // Show the artifact
            setShowArtifact(true);
            
            // Update the current step
            setCurrentStepId('completed');
            
            // Add to process logs
            setProcessLogs(prev => [...prev, `Blockchain data fetched successfully for ${address}`]);
            
            // Update the blockchain exploration status in the database
            if (user?.id) {
              try {
                await fetch(`/api/blockchain/exploration/${documentId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    status: 'completed',
                    results: result
                  }),
                });
              } catch (error) {
                console.error('Error updating blockchain exploration status in database:', error);
              }
            }
            
            // Clear the buffer
            buffer = '';
          } catch (e) {
            // Incomplete JSON, continue reading
            // Add to process logs
            setProcessLogs(prev => [...prev, `Processing data...`]);
          }
        }
      };
      
      // Start processing the stream
      await processStream();
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
      toast.error('Failed to fetch blockchain data');
      
      // Update the current step
      setCurrentStepId('error');
      
      // Add to process logs
      setProcessLogs(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      
      // Update the blockchain exploration status in the database
      if (user?.id && artifactData?.documentId) {
        try {
          await fetch(`/api/blockchain/exploration/${artifactData.documentId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'failed',
              results: null
            }),
          });
        } catch (error) {
          console.error('Error updating blockchain exploration status in database:', error);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
            <h1 className="text-2xl font-bold">Blockchain Forensics</h1>
          </div>
          <div className="flex items-center space-x-4">
            {isVerified ? (
              <div className="flex items-center text-green-500">
                <CheckCircle2 size={16} className="mr-1" />
                <span className="text-sm">Verified</span>
              </div>
            ) : (
              <Button
                onClick={() => router.push('/verify')}
                variant="outline"
                className="border-yellow-600 hover:border-yellow-500 text-yellow-500"
              >
                <ShieldAlert size={16} className="mr-1" />
                Verify Identity
              </Button>
            )}
            <Button
              onClick={() => logout()}
              variant="outline"
              className="border-gray-600 hover:border-gray-400 text-white"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Verification Status Banner */}
        {!isVerified && (
          <div className="mb-8 bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 flex items-start">
            <AlertCircle className="text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-yellow-500">Identity Verification Required</h3>
              <p className="text-sm text-gray-300 mt-1">
                Some premium features require identity verification. Please verify your identity to access all features.
              </p>
              <Button 
                onClick={() => router.push('/verify')} 
                variant="outline" 
                className="mt-3 border-yellow-600 hover:border-yellow-500 text-yellow-500"
              >
                Verify Now
              </Button>
            </div>
          </div>
        )}
        
        {/* Search Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Blockchain Explorer</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Enter blockchain address (0x...) or query"
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartSearch()}
              />
            </div>
            <Button
              onClick={handleStartSearch}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
          
          {/* Example queries */}
          <div className="mt-3">
            <p className="text-sm text-gray-400 mb-2">Example queries:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setQuery('0x388C818CA8B9251b393131C08a736A67ccB19297')}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full transition-colors"
              >
                Ethereum Address
              </button>
              <button
                onClick={() => setQuery('ethereum:0x388C818CA8B9251b393131C08a736A67ccB19297')}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full transition-colors"
              >
                Ethereum with Chain
              </button>
              <button
                onClick={() => setQuery('premium:0x388C818CA8B9251b393131C08a736A67ccB19297')}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full transition-colors"
              >
                Premium Feature (Requires Verification)
              </button>
            </div>
          </div>
        </div>
        
        {/* Process Viewer */}
        {isLoading && (
          <div className="mb-8">
            <ProcessViewer
              steps={defaultBlockchainExplorationSteps}
              currentStepId={currentStepId}
              logs={processLogs}
            />
          </div>
        )}
        
        {/* Results Section */}
        {showArtifact && blockchainResults && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Results</h2>
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
              <BlockchainExplorerArtifactActions
                inputs={{
                  address: artifactData?.address || '',
                  chain: artifactData?.chain || 'ethereum'
                }}
                updateInputs={(inputs) => {
                  setArtifactData({
                    ...artifactData,
                    ...inputs
                  });
                }}
              />
              
              {/* Display blockchain results here */}
              <div className="mt-6">
                {blockchainResults.transactions && blockchainResults.transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hash</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">From</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">To</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-900 divide-y divide-gray-800">
                        {blockchainResults.transactions.slice(0, 10).map((tx: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-400">
                              {tx.hash ? tx.hash.substring(0, 10) + '...' : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                              {tx.timestamp || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                              {tx.from ? tx.from.substring(0, 6) + '...' : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                              {tx.to ? tx.to.substring(0, 6) + '...' : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                              {tx.value || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    No transactions found for this address.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Recent Explorations */}
        {explorations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Recent Explorations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {explorations.map((exploration) => (
                <Card key={exploration.id} className="bg-gray-800/30 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">
                      {exploration.address ? exploration.address.substring(0, 8) + '...' : 'Query'}
                    </CardTitle>
                    <CardDescription>
                      {exploration.network || 'Ethereum'} • {new Date(exploration.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300 truncate">{exploration.query}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        exploration.status === 'completed' ? 'bg-green-100 text-green-800' :
                        exploration.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {exploration.status}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full border-gray-600 hover:border-gray-500"
                      onClick={() => router.push(`/dashboard?documentId=${exploration.documentId}`)}
                    >
                      View Results
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 