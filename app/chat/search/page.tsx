'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { BlockchainChat } from '@/components/blockchain-chat';
import { parseBlockchainQuery, isBlockchainQuery } from '@/lib/blockchain-query-parser';

function SearchContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('query');
  const [initialQuery, setInitialQuery] = useState<string | null>(null);
  
  useEffect(() => {
    if (queryParam) {
      // Validate if it's a blockchain query
      if (isBlockchainQuery(queryParam)) {
        // Parse the query to extract parameters
        const params = parseBlockchainQuery(queryParam);
        if (params) {
          setInitialQuery(queryParam);
          toast.success('Blockchain query detected and parsed successfully');
        } else {
          toast.error('Could not parse blockchain address from query');
        }
      } else {
        toast.info('Query may not be related to blockchain exploration');
        setInitialQuery(queryParam);
      }
    }
  }, [queryParam]);

  return (
    <>
      {queryParam && (
        <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-800">
          <h2 className="text-lg font-medium mb-2">Current Query:</h2>
          <div className="p-3 bg-gray-900 rounded-md font-mono text-green-400">
            {queryParam}
          </div>
        </div>
      )}
      
      <div className="flex-1 bg-gray-800/50 rounded-xl border border-gray-700 p-6 overflow-hidden">
        <BlockchainChat initialQuery={initialQuery || ''} />
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="flex-1 overflow-auto bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container h-full max-w-4xl py-6 md:py-8 lg:py-10">
        <div className="flex flex-col gap-8 h-full">
          <div className="flex justify-between items-center">
            <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
              Blockchain Explorer
            </h1>
            <Link href="/dashboard">
              <button className="flex items-center space-x-2 bg-transparent hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors">
                <ArrowLeft size={18} />
                <span>Back to Dashboard</span>
              </button>
            </Link>
          </div>
          
          <Suspense fallback={
            <div className="flex-1 bg-gray-800/50 rounded-xl border border-gray-700 p-6 overflow-hidden flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          }>
            <SearchContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 