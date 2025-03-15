import { NextRequest, NextResponse } from 'next/server';
import { canHandleAnalysisType, executeDuneStrategy } from '@/app/strategies/dune-based';

// Define the request payload type with array of addresses
interface RunStrategyRequestPayload {
  addresses: string[];
  analysis_type: string;
}

// Mark this route as not requiring authentication
export const dynamic = 'force-dynamic';

/**
 * POST /api/run-strategy
 * 
 * Accepts a JSON payload with:
 * - addresses: An array of blockchain addresses to analyze
 * - analysis_type: The type of analysis to perform
 * 
 * This endpoint will:
 * 1. Process the strategy request for the given addresses
 * 2. Return results based on the analysis type
 */
export async function POST(request: NextRequest) {
  console.log('API route handler called: /api/run-strategy');
  
  try {
    // Parse the JSON request body
    const payload = await request.json() as RunStrategyRequestPayload;
    console.log('Received payload:', payload);
    
    // Validate required fields
    if (!payload.addresses || !Array.isArray(payload.addresses) || payload.addresses.length === 0) {
      console.error('Missing or invalid field: addresses must be a non-empty array');
      return NextResponse.json(
        { error: 'Missing or invalid field: addresses must be a non-empty array' },
        { status: 400 }
      );
    }
    
    if (!payload.analysis_type) {
      console.error('Missing required field: analysis_type');
      return NextResponse.json(
        { error: 'Missing required field: analysis_type' },
        { status: 400 }
      );
    }
    
    // Check if we can handle this analysis type
    const canHandle = canHandleAnalysisType(payload.analysis_type);
    console.log(`Can handle analysis type '${payload.analysis_type}': ${canHandle}`);
    
    if (canHandle) {
      // Execute the Dune-based strategy
      console.log('Executing Dune strategy...');
      const relationships = await executeDuneStrategy(payload);
      console.log(`Strategy execution complete. Found ${relationships.length} relationships.`);
      
      return NextResponse.json({
        status: 'success',
        data: relationships
      });
    }
    
    // For analysis types we don't handle yet
    console.error(`Unsupported analysis type: ${payload.analysis_type}`);
    return NextResponse.json({
      status: 'error',
      message: `Unsupported analysis type: ${payload.analysis_type}`,
      supportedTypes: ['bidirectional_transfers', 'funding_address']
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error processing strategy request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
