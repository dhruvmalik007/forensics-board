'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
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
  const { user } = usePrivyAuthWithDB();
  
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showArtifact, setShowArtifact] = useState(false);
  const [artifactData, setArtifactData] = useState<any>(null);
  const [blockchainResults, setBlockchainResults] = useState<any>(null);
  const [currentStepId, setCurrentStepId] = useState<string>('understanding');
  const [processLogs, setProcessLogs] = useState<string[]>([]);
  const chatId = nanoid();
  const { setArtifact } = useArtifact();
  
  // Create a state for artifacts since it's not provided by useArtifact
  const [artifacts, setArtifacts] = useState<UIArtifact[]>([]);
  
  // Find blockchain explorer artifact if it exists
  const blockchainArtifact = artifacts?.find((a) => a.kind === 'blockchain-explorer');
  
  // Get blockchain explorations using the hook
  const { explorations, currentExploration, getExplorations } = useBlockchainExploration({
    privyDID: user?.id || '',
  });
  
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
        signal
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      // Process the streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }
      
      // Read the stream
      const decoder = new TextDecoder();
      let buffer = '';
      
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }
            
            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete events in the buffer
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(5));
                  
                  // Handle different event types
                  if (data.type === 'result-update') {
                    setBlockchainResults(data.content);
                    
                    // Update the artifact content
                    setArtifacts(prev => 
                      prev.map(a => 
                        a.documentId === documentId 
                          ? { ...a, content: JSON.stringify(data.content) } 
                          : a
                      )
                    );
                    
                    // Update the exploration results in the database
                    if (user?.id) {
                      try {
                        const exploration = explorations.find(e => e.documentId === documentId);
                        if (exploration) {
                          await fetch('/api/blockchain/exploration', {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              id: exploration.id,
                              status: 'completed',
                              results: data.content
                            }),
                          });
                        }
                      } catch (error) {
                        console.error('Error updating blockchain exploration results:', error);
                      }
                    }
                    
                    setShowArtifact(true);
                    setIsLoading(false);
                  } 
                  // Handle step updates
                  else if (data.type === 'step-update') {
                    const { currentStepId, log } = data.content;
                    setCurrentStepId(currentStepId);
                    setProcessLogs(prev => [...prev, log]);
                    
                    // Update the exploration status in the database
                    if (user?.id) {
                      try {
                        const exploration = explorations.find(e => e.documentId === documentId);
                        if (exploration) {
                          await fetch('/api/blockchain/exploration', {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              id: exploration.id,
                              status: 'in_progress'
                            }),
                          });
                        }
                      } catch (error) {
                        console.error('Error updating blockchain exploration status:', error);
                      }
                    }
                  }
                } catch (e) {
                  console.error('Error parsing event data:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error reading stream:', error);
          setIsLoading(false);
          
          // Update the exploration status to failed in the database
          if (user?.id) {
            try {
              const exploration = explorations.find(e => e.documentId === documentId);
              if (exploration) {
                await fetch('/api/blockchain/exploration', {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    id: exploration.id,
                    status: 'failed'
                  }),
                });
              }
            } catch (error) {
              console.error('Error updating blockchain exploration status to failed:', error);
            }
          }
        }
      };
      
      // Start processing the stream
      processStream();
      
      // Update URL with the document ID
      router.push(`/dashboard?documentId=${documentId}`);
      
      // Cleanup function
      return () => {
        controller.abort();
      };
      
    } catch (error) {
      console.error('Error starting blockchain search:', error);
      toast.error('Failed to start blockchain search');
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
          <Link href="/">
            <button className="bg-transparent border border-gray-600 hover:border-gray-400 text-white px-5 py-2 rounded-lg font-medium transition-colors">
              Back to Home
            </button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Blockchain Explorer Dashboard</h1>
          
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6 text-center">Search Blockchain Transactions</h2>
            
            <div className="mb-6">
              <SuggestedActions 
                chatId={chatId} 
                append={async (message) => {
                  setQuery(message.content);
                  return null;
                }} 
              />
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="query" className="block text-sm font-medium mb-2">
                  Enter your blockchain query
                </label>
                <textarea
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Example: Show me the transactions for 0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b on ethereum including cross-chain transactions via layerzero"
                  className="w-full p-4 bg-gray-900 border border-gray-700 rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                />
              </div>
              
              <button
                onClick={handleStartSearch}
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    <span>Search Blockchain</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Process Viewer Component */}
          {isLoading && (
            <div className="mb-8">
              <ProcessViewer 
                steps={defaultBlockchainExplorationSteps} 
                currentStepId={currentStepId}
                logs={processLogs}
              />
            </div>
          )}
          
          {/* Blockchain Explorer Artifact */}
          {(showArtifact || blockchainArtifact) && (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-8 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Blockchain Explorer Results</h3>
                {artifactData && (
                  <BlockchainExplorerArtifactActions 
                    inputs={{
                      address: artifactData.address,
                      chain: artifactData.chain
                    }}
                    updateInputs={(inputs: any) => {
                      setArtifactData({
                        ...artifactData,
                        ...inputs
                      });
                    }}
                  />
                )}
              </div>
              
              <div className="artifact-container">
                <div className="blockchain-explorer-content">
                  {blockchainResults ? (
                    <div className="space-y-6">
                      {/* Explorer Information */}
                      <div className="p-4 bg-gray-900 rounded-md">
                        <h4 className="text-lg font-semibold mb-2">Explorer Information</h4>
                        <p>
                          <span className="font-medium">Name:</span> {blockchainResults.explorer?.project_name || 'Unknown'}
                        </p>
                        <p>
                          <span className="font-medium">URL:</span>{' '}
                          <a
                            href={blockchainResults.explorer?.explorer_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {blockchainResults.explorer?.explorer_url || 'N/A'}
                          </a>
                        </p>
                        <p>
                          <span className="font-medium">Chain:</span> {blockchainResults.explorer?.chain || artifactData?.chain || 'Unknown'}
                        </p>
                        <p>
                          <span className="font-medium">Category:</span> {blockchainResults.explorer?.category || artifactData?.category || 'Unknown'}
                        </p>
                      </div>
                      
                      {/* Transactions Table */}
                      {blockchainResults.transactions && blockchainResults.transactions.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold mb-2">
                            Transactions ({blockchainResults.metadata?.scraped || 0} of {blockchainResults.metadata?.total || 0})
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                              <thead className="bg-gray-800">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hash</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">From</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">To</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                </tr>
                              </thead>
                              <tbody className="bg-gray-900 divide-y divide-gray-800">
                                {blockchainResults.transactions.map((tx: any, index: number) => (
                                  <tr key={index} className="hover:bg-gray-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-400">
                                      <a
                                        href={`${blockchainResults.explorer?.explorer_url}/tx/${tx.hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline"
                                      >
                                        {tx.hash.substring(0, 10)}...
                                      </a>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                      {tx.timestamp}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                      {tx.from ? (
                                        <a
                                          href={`${blockchainResults.explorer?.explorer_url}/address/${tx.from}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="hover:underline"
                                        >
                                          {tx.from.substring(0, 6)}...
                                        </a>
                                      ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                      {tx.to ? (
                                        <a
                                          href={`${blockchainResults.explorer?.explorer_url}/address/${tx.to}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="hover:underline"
                                        >
                                          {tx.to.substring(0, 6)}...
                                        </a>
                                      ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                      {tx.value || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <span className={`px-2 py-1 rounded-full text-xs ${
                                        tx.status === 'Success' ? 'bg-green-900/30 text-green-400' : 
                                        tx.status === 'Failed' ? 'bg-red-900/30 text-red-400' : 
                                        'bg-gray-800 text-gray-400'
                                      }`}>
                                        {tx.status || 'Unknown'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : blockchainArtifact && blockchainArtifact.content ? (
                    <div className="space-y-6">
                      {/* Try to parse and display the content */}
                      {(() => {
                        try {
                          const parsedContent = JSON.parse(blockchainArtifact.content);
                          return (
                            <>
                              {/* Explorer Information */}
                              <div className="p-4 bg-gray-900 rounded-md">
                                <h4 className="text-lg font-semibold mb-2">Explorer Information</h4>
                                <p>
                                  <span className="font-medium">Address:</span> {parsedContent.address || artifactData?.address || 'Unknown'}
                                </p>
                                <p>
                                  <span className="font-medium">Chain:</span> {parsedContent.chain || artifactData?.chain || 'Unknown'}
                                </p>
                                <p>
                                  <span className="font-medium">Category:</span> {parsedContent.category || artifactData?.category || 'Unknown'}
                                </p>
                              </div>
                              
                              {/* Display summary if available */}
                              {parsedContent.summary && (
                                <div className="p-4 bg-gray-900 rounded-md">
                                  <h4 className="text-lg font-semibold mb-2">Summary</h4>
                                  <p className="whitespace-pre-wrap">{parsedContent.summary}</p>
                                </div>
                              )}
                              
                              {/* Display transactions if available */}
                              {parsedContent.transactions && parsedContent.transactions.length > 0 && (
                                <div>
                                  <h4 className="text-lg font-semibold mb-2">
                                    Transactions ({parsedContent.metadata?.scraped || 0} of {parsedContent.metadata?.total || 0})
                                  </h4>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-700">
                                      <thead className="bg-gray-800">
                                        <tr>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hash</th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">From</th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">To</th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-gray-900 divide-y divide-gray-800">
                                        {parsedContent.transactions.map((tx: any, index: number) => (
                                          <tr key={index} className="hover:bg-gray-800">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-400">
                                              <a
                                                href={`${parsedContent.explorer?.explorer_url}/tx/${tx.hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:underline"
                                              >
                                                {tx.hash.substring(0, 10)}...
                                              </a>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                              {tx.timestamp}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                              {tx.from ? (
                                                <a
                                                  href={`${parsedContent.explorer?.explorer_url}/address/${tx.from}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="hover:underline"
                                                >
                                                  {tx.from.substring(0, 6)}...
                                                </a>
                                              ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                              {tx.to ? (
                                                <a
                                                  href={`${parsedContent.explorer?.explorer_url}/address/${tx.to}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="hover:underline"
                                                >
                                                  {tx.to.substring(0, 6)}...
                                                </a>
                                              ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                              {tx.value || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                              <span className={`px-2 py-1 rounded-full text-xs ${
                                                tx.status === 'Success' ? 'bg-green-900/30 text-green-400' : 
                                                tx.status === 'Failed' ? 'bg-red-900/30 text-red-400' : 
                                                'bg-gray-800 text-gray-400'
                                              }`}>
                                                {tx.status || 'Unknown'}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        } catch (e) {
                          return (
                            <pre className="text-sm overflow-auto p-4 bg-gray-900 rounded">
                              {blockchainArtifact.content}
                            </pre>
                          );
                        }
                      })()}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-400">
                      No blockchain data available yet. Start a search to see results.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 