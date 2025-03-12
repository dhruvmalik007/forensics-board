'use client';

import { Artifact } from '@/components/create-artifact';
import { BlockchainExplorerScraper } from '@/packages/browser-scraping/src';
import { ScrapingResult, Transaction } from '@/packages/browser-scraping/src/types';
import { useState } from 'react';
import { toast } from 'sonner';
import { SearchIcon, RefreshCwIcon, DownloadIcon, ClipboardCopyIcon, FileTextIcon, TableIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface BlockchainExplorerMetadata {
  address: string;
  chain: string;
  category: 'chain-explorer' | 'crosschain-txn' | 'intent-bridge' | 'intel-txn';
  result?: ScrapingResult;
  summary?: string;
  isLoading: boolean;
  error?: string;
  viewMode?: 'table' | 'summary';
}

// Define custom stream part types for blockchain explorer
interface BlockchainExplorerStreamPart {
  type: 
    | 'address-update' 
    | 'chain-update' 
    | 'category-update' 
    | 'result-update' 
    | 'summary-update' 
    | 'error-update'
    | 'text-delta' 
    | 'code-delta' 
    | 'sheet-delta' 
    | 'image-delta' 
    | 'title' 
    | 'id' 
    | 'suggestion' 
    | 'clear' 
    | 'finish' 
    | 'kind';
  content: string | ScrapingResult | any;
}

export const blockchainExplorerArtifact = new Artifact<'blockchain-explorer', BlockchainExplorerMetadata>({
  kind: 'blockchain-explorer',
  description: 'Explore blockchain transactions for any address across multiple networks',
  
  // Initialize the artifact with default metadata
  initialize: async ({ documentId, setMetadata }) => {
    setMetadata({
      address: '',
      chain: 'ethereum',
      category: 'chain-explorer',
      isLoading: false,
      viewMode: 'table'
    });
  },
  
  // Handle streaming updates from the server
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    const part = streamPart as BlockchainExplorerStreamPart;
    
    if (part.type === 'address-update') {
      setMetadata((metadata) => ({
        ...metadata,
        address: part.content as string,
      }));
    }
    
    if (part.type === 'chain-update') {
      setMetadata((metadata) => ({
        ...metadata,
        chain: part.content as string,
      }));
    }
    
    if (part.type === 'category-update') {
      setMetadata((metadata) => ({
        ...metadata,
        category: part.content as any,
      }));
    }
    
    if (part.type === 'result-update') {
      const result = part.content as ScrapingResult;
      setMetadata((metadata) => ({
        ...metadata,
        result,
        isLoading: false,
      }));
      
      // Update the artifact content with the transaction data
      const content = JSON.stringify(result, null, 2);
      
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content,
        status: 'streaming',
      }));
    }
    
    if (part.type === 'summary-update') {
      setMetadata((metadata) => ({
        ...metadata,
        summary: part.content as string,
      }));
    }
    
    if (part.type === 'error-update') {
      setMetadata((metadata) => ({
        ...metadata,
        error: part.content as string,
        isLoading: false,
      }));
      
      toast.error(part.content as string);
    }
  },
  
  // Define the content component for the artifact
  content: ({
    mode,
    status,
    content,
    isCurrentVersion,
    currentVersionIndex,
    onSaveContent,
    getDocumentContentById,
    isLoading: isDocumentLoading,
    metadata,
    setMetadata,
  }) => {
    const [address, setAddress] = useState(metadata?.address || '');
    const [chain, setChain] = useState(metadata?.chain || 'ethereum');
    const [category, setCategory] = useState(metadata?.category || 'chain-explorer');
    const [limit, setLimit] = useState(10);
    const [isSearching, setIsSearching] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'summary'>(metadata?.viewMode || 'table');
    
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
    
    const categories = [
      { id: 'chain-explorer', name: 'Chain Explorer' },
      { id: 'crosschain-txn', name: 'Cross-Chain Transaction' },
      { id: 'intent-bridge', name: 'Intent Bridge' },
      { id: 'intel-txn', name: 'Intelligence' },
    ];
    
    const handleSearch = async () => {
      if (!address) {
        toast.error('Please enter an address');
        return;
      }
      
      setIsSearching(true);
      setMetadata((currentMetadata) => ({
        ...currentMetadata,
        address,
        chain,
        category,
        isLoading: true,
        error: undefined,
      }));
      
      try {
        // Create a new scraper instance
        const scraper = new BlockchainExplorerScraper();
        
        // Scrape transactions
        const result = await scraper.scrapeTransactions({
          address,
          chain,
          category,
          limit,
        });
        
        // Generate summary
        const summary = await scraper.generateSummary(result);
        
        // Update metadata
        setMetadata((currentMetadata) => ({
          ...currentMetadata,
          result,
          summary,
          isLoading: false,
          viewMode,
        }));
        
        // Save content
        const contentToSave = JSON.stringify(result, null, 2);
        onSaveContent(contentToSave, false);
        
      } catch (error) {
        console.error('Error searching blockchain data:', error);
        setMetadata((currentMetadata) => ({
          ...currentMetadata,
          error: error instanceof Error ? error.message : 'An unknown error occurred',
          isLoading: false,
        }));
        toast.error('Failed to search blockchain data');
      } finally {
        setIsSearching(false);
      }
    };
    
    const toggleViewMode = () => {
      const newViewMode = viewMode === 'table' ? 'summary' : 'table';
      setViewMode(newViewMode);
      setMetadata((currentMetadata) => ({
        ...currentMetadata,
        viewMode: newViewMode,
      }));
    };
    
    // Parse the content as a ScrapingResult
    let parsedResult: ScrapingResult | undefined;
    try {
      if (content && content.trim()) {
        parsedResult = JSON.parse(content);
      } else if (metadata?.result) {
        parsedResult = metadata.result;
      }
    } catch (error) {
      console.error('Error parsing content:', error);
    }
    
    if (isDocumentLoading || metadata?.isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg">Searching blockchain data...</p>
        </div>
      );
    }
    
    if (mode === 'diff') {
      const oldContent = getDocumentContentById(currentVersionIndex - 1);
      const newContent = getDocumentContentById(currentVersionIndex);
      
      return (
        <div className="p-6 h-full overflow-auto">
          <h3 className="text-xl font-semibold mb-4">Changes in Blockchain Data</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-md p-4 bg-red-50 dark:bg-red-900/20">
              <h4 className="font-medium mb-2">Previous Version</h4>
              <pre className="text-sm overflow-auto p-2 bg-white dark:bg-black rounded">{oldContent}</pre>
            </div>
            <div className="border rounded-md p-4 bg-green-50 dark:bg-green-900/20">
              <h4 className="font-medium mb-2">Current Version</h4>
              <pre className="text-sm overflow-auto p-2 bg-white dark:bg-black rounded">{newContent}</pre>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col h-full overflow-auto">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold mb-4">Blockchain Explorer</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-1">
                Wallet Address
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent"
                disabled={!isCurrentVersion}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="chain" className="block text-sm font-medium mb-1">
                  Blockchain
                </label>
                <select
                  id="chain"
                  value={chain}
                  onChange={(e) => setChain(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent"
                  disabled={!isCurrentVersion}
                >
                  {chains.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-1">
                  Explorer Type
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent"
                  disabled={!isCurrentVersion}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="limit" className="block text-sm font-medium mb-1">
                  Transaction Limit
                </label>
                <input
                  id="limit"
                  type="number"
                  min="1"
                  max="50"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent"
                  disabled={!isCurrentVersion}
                />
              </div>
            </div>
            
            <div className="flex flex-row gap-2">
              {isCurrentVersion && (
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !address}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <SearchIcon size={16} />
                      <span>Search Transactions</span>
                    </>
                  )}
                </button>
              )}
              
              {parsedResult && (
                <button
                  onClick={toggleViewMode}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  {viewMode === 'table' ? (
                    <>
                      <FileTextIcon size={16} />
                      <span>View Summary</span>
                    </>
                  ) : (
                    <>
                      <TableIcon size={16} />
                      <span>View Table</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {metadata?.error && (
          <div className="p-4 m-6 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md">
            {metadata.error}
          </div>
        )}
        
        {parsedResult && (
          <div className="p-6 space-y-6">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
              <h3 className="text-lg font-semibold mb-2">Explorer Information</h3>
              <p>
                <span className="font-medium">Name:</span> {parsedResult.explorer.project_name}
              </p>
              <p>
                <span className="font-medium">URL:</span>{' '}
                <a
                  href={parsedResult.explorer.explorer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {parsedResult.explorer.explorer_url}
                </a>
              </p>
              <p>
                <span className="font-medium">Chain:</span> {parsedResult.explorer.chain || chain}
              </p>
              <p>
                <span className="font-medium">Category:</span> {parsedResult.explorer.category}
              </p>
            </div>
            
            {metadata?.summary && viewMode === 'summary' && (
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                <h3 className="text-lg font-semibold mb-2">Transaction Analysis</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>
                    {metadata.summary}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            
            {viewMode === 'table' && (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Transactions ({parsedResult.metadata.scraped} of {parsedResult.metadata.total})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Hash
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          From
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {parsedResult.transactions.map((tx: Transaction, index: number) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                            <a
                              href={`${parsedResult.explorer.explorer_url}/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {tx.hash.substring(0, 10)}...
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {tx.timestamp}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {tx.from ? (
                              <a
                                href={`${parsedResult.explorer.explorer_url}/address/${tx.from}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {tx.from.substring(0, 6)}...
                              </a>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {tx.to ? (
                              <a
                                href={`${parsedResult.explorer.explorer_url}/address/${tx.to}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {tx.to.substring(0, 6)}...
                              </a>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {tx.value || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              tx.status === 'Success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                              tx.status === 'Failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
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
        )}
      </div>
    );
  },
  
  // Define actions for the artifact
  actions: [
    {
      icon: <RefreshCwIcon size={16} />,
      description: 'Refresh blockchain data',
      label: 'Refresh',
      onClick: async ({ metadata, setMetadata }) => {
        if (!metadata?.address) {
          toast.error('No address to refresh');
          return;
        }
        
        setMetadata((currentMetadata) => ({
          ...currentMetadata,
          isLoading: true,
        }));
        
        try {
          const scraper = new BlockchainExplorerScraper();
          const result = await scraper.scrapeTransactions({
            address: metadata.address,
            chain: metadata.chain,
            category: metadata.category,
            limit: 10,
          });
          
          const summary = await scraper.generateSummary(result);
          
          setMetadata((currentMetadata) => ({
            ...currentMetadata,
            result,
            summary,
            isLoading: false,
          }));
          
          toast.success('Blockchain data refreshed');
        } catch (error) {
          console.error('Error refreshing blockchain data:', error);
          setMetadata((currentMetadata) => ({
            ...currentMetadata,
            error: error instanceof Error ? error.message : 'An unknown error occurred',
            isLoading: false,
          }));
          toast.error('Failed to refresh blockchain data');
        }
      },
      isDisabled: ({ metadata }) => !metadata?.address || metadata?.isLoading,
    },
    {
      icon: <DownloadIcon size={16} />,
      description: 'Download transaction data as JSON',
      label: 'Download',
      onClick: ({ metadata }) => {
        if (!metadata?.result) {
          toast.error('No data to download');
          return;
        }
        
        const dataStr = JSON.stringify(metadata.result, null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
        
        const exportFileDefaultName = `blockchain-data-${metadata.address.substring(0, 8)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        toast.success('Download started');
      },
      isDisabled: ({ metadata }) => !metadata?.result,
    },
    {
      icon: <ClipboardCopyIcon size={16} />,
      description: 'Copy address to clipboard',
      label: 'Copy Address',
      onClick: ({ metadata }) => {
        if (!metadata?.address) {
          toast.error('No address to copy');
          return;
        }
        
        navigator.clipboard.writeText(metadata.address);
        toast.success('Address copied to clipboard');
      },
      isDisabled: ({ metadata }) => !metadata?.address,
    },
    {
      icon: <FileTextIcon size={16} />,
      description: 'Toggle between table and summary view',
      label: 'Toggle View',
      onClick: ({ metadata, setMetadata }) => {
        if (!metadata?.result) {
          toast.error('No data to display');
          return;
        }
        
        const newViewMode = metadata.viewMode === 'table' ? 'summary' : 'table';
        
        setMetadata((currentMetadata) => ({
          ...currentMetadata,
          viewMode: newViewMode,
        }));
        
        toast.success(`Switched to ${newViewMode} view`);
      },
      isDisabled: ({ metadata }) => !metadata?.result,
    },
  ],
  
  // Define toolbar actions
  toolbar: [
    {
      icon: <SearchIcon size={16} />,
      description: 'Search for a different address',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'I want to search for a different blockchain address',
        });
      },
    },
  ],
}); 