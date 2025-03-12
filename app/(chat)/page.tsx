import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { BlockchainChat } from '@/components/blockchain-chat';
import { cookies } from 'next/headers';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { BlockchainNav } from '@/components/blockchain-nav';

export default async function Page({
  searchParams,
}: {
  searchParams: { query?: string };
}) {
  // Check authentication
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  // Get the chat model from cookies
  const cookieStore = await cookies();
  const chatModelCookie = cookieStore.get('chat-model');
  const chatModel = chatModelCookie?.value || DEFAULT_CHAT_MODEL;

  // Get the query parameter
  const initialQuery = searchParams.query || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <BlockchainNav />
        
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Blockchain Explorer</h1>
          <p className="text-gray-300 mb-8">
            Analyze blockchain transactions and explore cross-chain activities using natural language queries.
          </p>
          
          {initialQuery && (
            <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-800 mb-6">
              <h2 className="text-lg font-medium mb-2">Current Query:</h2>
              <div className="p-3 bg-gray-900 rounded-md font-mono text-green-400">
                {initialQuery}
              </div>
            </div>
          )}
          
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 h-[calc(100vh-240px)] overflow-hidden">
            <BlockchainChat initialQuery={initialQuery} />
          </div>
        </div>
      </div>
    </div>
  );
}
