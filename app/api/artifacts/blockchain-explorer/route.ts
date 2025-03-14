import { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { BlockchainExplorerScraper } from '@/packages/browser-scraping/src';
import { saveDocument } from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  const session = await auth();
  
  // Allow unauthenticated users for demo purposes
  const userId = session?.user?.id || 'anonymous';
  
  const { id, title, address, chain, category, query } = await req.json();
  
  // Create a streaming response using ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const writeToStream = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      
      // Helper function to update step and send logs
      const updateStep = (stepId: string, log: string) => {
        writeToStream({
          type: 'step-update',
          content: {
            currentStepId: stepId,
            log
          }
        });
      };
      
      try {
        // Step 1: Understanding Query
        updateStep('understanding', `Starting blockchain exploration for address ${address} on ${chain}`);
        updateStep('understanding', `Query detected: ${query}`);
        updateStep('understanding', `Category: ${category}`);
        
        // Send address update to client
        writeToStream({
          type: 'address-update',
          content: address,
        });
        
        // Send chain update to client
        writeToStream({
          type: 'chain-update',
          content: chain,
        });
        
        // Send category update to client
        writeToStream({
          type: 'category-update',
          content: category,
        });
        
        // Step 2: Searching Blockchain Explorer
        updateStep('searching', `Connecting to blockchain explorers for ${chain}...`);
        updateStep('searching', `Initializing blockchain explorer scraper`);
        
        // Create a new scraper instance
        const scraper = new BlockchainExplorerScraper();
        
        // Step 3: Cross-Chain Analysis (if applicable)
        if (category === 'crosschain-txn') {
          updateStep('crosschain', `Performing cross-chain analysis for ${address}`);
          updateStep('crosschain', `Searching for bridge transactions and cross-chain activity`);
        }
        
        // Step 4: Fetching Transaction Data
        updateStep('fetching', `Fetching transaction data for ${address}`);
        updateStep('fetching', `Requesting up to 10 transactions from the blockchain`);
        
        // Scrape transactions
        const result = await scraper.scrapeTransactions({
          address,
          chain,
          category: category as any,
          limit: 10,
        });
        
        updateStep('fetching', `Successfully retrieved ${result.transactions?.length || 0} transactions`);
        
        // Step 5: Processing Results
        updateStep('processing', `Processing transaction data`);
        updateStep('processing', `Generating transaction summary`);
        
        // Generate summary
        const summary = await scraper.generateSummary(result);
        
        updateStep('processing', `Summary generation complete`);
        
        // Step 6: Rendering Results
        updateStep('rendering', `Preparing data for visualization`);
        
        // Send results to client
        writeToStream({
          type: 'result-update',
          content: result,
        });
        
        writeToStream({
          type: 'summary-update',
          content: summary,
        });
        
        updateStep('rendering', `Blockchain exploration complete`);
        
        // Save the document
        await saveDocument({
          id,
          title,
          content: JSON.stringify({
            address,
            chain,
            category,
            result,
            summary,
            query
          }),
          kind: 'blockchain-explorer',
          userId,
        });
        
      } catch (error) {
        console.error('Error scraping blockchain data:', error);
        writeToStream({
          type: 'error-update',
          content: error instanceof Error ? error.message : 'An unknown error occurred',
        });
        
        // Send error step update
        updateStep('error', `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
      } finally {
        controller.close();
      }
    }
  });
  
  // Return the stream response using the standard Response API
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 