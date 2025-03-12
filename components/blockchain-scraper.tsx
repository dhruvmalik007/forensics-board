'use client';

import { useState } from 'react';
import { SearchIcon, RefreshCwIcon } from 'lucide-react';
import { toast } from 'sonner';

// This component provides a UI for interacting with our blockchain-explorer artifact
export function BlockchainScraper() {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [isLoading, setIsLoading] = useState(false);
  
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
  
  const handleSearch = async () => {
    if (!address) {
      toast.error('Please enter an address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Instead of directly calling the API, we'll send a message to the chat
      // This will trigger the blockchain-explorer artifact
      const chatInput = document.querySelector('textarea[placeholder*="Message"]') as HTMLTextAreaElement;
      const sendButton = document.querySelector('button[aria-label*="Send message"]') as HTMLButtonElement;
      
      if (chatInput && sendButton) {
        chatInput.value = `Show me the transactions for ${address} on ${chain}`;
        
        // Dispatch input event to trigger any listeners
        const inputEvent = new Event('input', { bubbles: true });
        chatInput.dispatchEvent(inputEvent);
        
        // Trigger the send button click
        setTimeout(() => {
          sendButton.click();
          setIsLoading(false);
        }, 100);
      } else {
        throw new Error('Could not find chat input or send button');
      }
    } catch (error) {
      console.error('Error searching blockchain data:', error);
      toast.error('Failed to search blockchain data');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
        />
      </div>
      
      <div>
        <label htmlFor="chain" className="block text-sm font-medium mb-1">
          Blockchain
        </label>
        <select
          id="chain"
          value={chain}
          onChange={(e) => setChain(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent"
        >
          {chains.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      
      <button
        onClick={handleSearch}
        disabled={isLoading || !address}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
      >
        {isLoading ? (
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
      
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Enter a wallet address to explore its transactions on the selected blockchain.
      </p>
    </div>
  );
} 