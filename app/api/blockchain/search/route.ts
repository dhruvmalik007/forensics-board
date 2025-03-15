import { NextResponse } from 'next/server';
import { z } from 'zod';
import { StagehandService } from '../../../../packages/browser-scraping/src/services/stagehand-service';

// Input validation schema
const searchParamsSchema = z.object({
  address: z.string().min(1).max(100),
  chain: z.string().min(1).max(50).optional(),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
  categorize: z.coerce.boolean().optional().default(false)
});

export async function GET(request: Request) {
  try {
    // Get URL params
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const chain = searchParams.get('chain') || undefined;
    const limit = searchParams.get('limit') 
      ? parseInt(searchParams.get('limit') || '10', 10) 
      : undefined;
    const categorize = searchParams.get('categorize') === 'true';

    // Validate params
    const result = searchParamsSchema.safeParse({ address, chain, limit, categorize });
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid parameters', 
        details: result.error.issues 
      }, { status: 400 });
    }

    // Initialize Stagehand service
    const stagehandService = new StagehandService();
    
    let transactions;
    
    if (result.data.categorize) {
      // Use the explorer service to find the right explorer
      const ExplorerService = require('../../../../packages/browser-scraping/src/services/explorer-service').ExplorerService;
      const explorerService = new ExplorerService();
      
      const chain = result.data.chain || 'ethereum';
      const explorer = explorerService.findExplorer(chain, 'chain-explorer') ||
                       explorerService.findExplorerByName('Etherscan');
      
      if (!explorer) {
        return NextResponse.json({ 
          error: 'No suitable explorer found for the specified chain' 
        }, { status: 400 });
      }
      
      // Get transactions with address categorization
      transactions = await stagehandService.scrapeTransactionsWithCategories(
        explorer,
        result.data.address,
        result.data.limit
      );
    } else {
      // Fetch transactions for the address without categorization
      transactions = await stagehandService.fetchTransactionsForDashboard(
        result.data.address,
        result.data.chain
      );
    }

    return NextResponse.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error in blockchain search:', error);
    return NextResponse.json({ 
      error: 'Failed to search blockchain',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST method for more complex search parameters
export async function POST(request: Request) {
  try {
    // Parse JSON body
    const body = await request.json();
    
    // Validate address is present
    if (!body.address) {
      return NextResponse.json({ 
        error: 'Address is required' 
      }, { status: 400 });
    }

    // Initialize Stagehand service
    const stagehandService = new StagehandService();
    
    // Determine if we need detailed transaction info or categorization
    const getDetailedInfo = body.detailed === true;
    const getCategorization = body.categorize === true;
    
    let transactions;
    
    // Use the explorer service to find the right explorer
    const ExplorerService = require('../../../../packages/browser-scraping/src/services/explorer-service').ExplorerService;
    const explorerService = new ExplorerService();
    
    const chain = body.chain || 'ethereum';
    const explorer = explorerService.findExplorer(chain, 'chain-explorer') ||
                     explorerService.findExplorerByName('Etherscan');
    
    if (!explorer) {
      return NextResponse.json({ 
        error: 'No suitable explorer found for the specified chain' 
      }, { status: 400 });
    }
    
    if (getCategorization) {
      // Get transactions with address categorization
      transactions = await stagehandService.scrapeTransactionsWithCategories(
        explorer,
        body.address,
        body.limit || 10
      );
    } else if (getDetailedInfo) {
      // Get detailed transaction data with recursive clicks
      transactions = await stagehandService.scrapeDetailedTransactions(
        explorer,
        body.address
      );
    } else {
      // Get basic transaction data
      transactions = await stagehandService.fetchTransactionsForDashboard(
        body.address,
        body.chain
      );
    }

    return NextResponse.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error in blockchain search:', error);
    return NextResponse.json({ 
      error: 'Failed to search blockchain',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 