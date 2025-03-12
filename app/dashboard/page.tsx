'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Search, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleStartSearch = () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    
    setIsLoading(true);
    
    // Redirect to search page with the query as a URL parameter
    router.push(`/chat?query=${encodeURIComponent(query)}`);
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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Blockchain Explorer Dashboard</h1>
          
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6 text-center">Search Blockchain Transactions</h2>
            
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
          
          <div className="flex justify-between">
            <Link href="/chat">
              <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                <ArrowRight size={16} />
                <span>Go to Blockchain Explorer Chat</span>
              </button>
            </Link>
            
            <a 
              href="https://etherscan.io/" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink size={16} />
              Visit Etherscan
            </a>
          </div>
        </div>
      </main>
    </div>
  );
} 