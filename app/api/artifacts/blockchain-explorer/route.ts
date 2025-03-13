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
      
      try {
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
        
        // Create a new scraper instance
        const scraper = new BlockchainExplorerScraper();
        
        // Scrape transactions
        const result = await scraper.scrapeTransactions({
          address,
          chain,
          category: category as any,
          limit: 10,
        });
        
        // Generate summary
        const summary = await scraper.generateSummary(result);
        
        // Send results to client
        writeToStream({
          type: 'result-update',
          content: result,
        });
        
        writeToStream({
          type: 'summary-update',
          content: summary,
        });
        
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