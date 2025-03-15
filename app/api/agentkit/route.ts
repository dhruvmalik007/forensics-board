import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AgentService } from '../../../packages/agentkit/src/services/agent-service';
import { SelectedNodeSchema } from '../../../packages/agentkit/src/types';

// Input validation schema
const actionParamsSchema = z.object({
  selectedNode: SelectedNodeSchema,
  userAddress: z.string().min(1).max(100)
});

export async function POST(request: Request) {
  try {
    // Parse JSON body
    const body = await request.json();
    
    // Validate params
    const result = actionParamsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid parameters', 
        details: result.error.issues 
      }, { status: 400 });
    }

    // Initialize AgentKit service
    const agentService = new AgentService();
    
    // Process the node selection
    const action = await agentService.processNodeSelection(
      result.data.selectedNode,
      result.data.userAddress
    );

    return NextResponse.json({
      success: true,
      data: action
    });
  } catch (error) {
    console.error('Error in AgentKit action:', error);
    return NextResponse.json({ 
      error: 'Failed to process agent action',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET method for token information
export async function GET(request: Request) {
  try {
    // Get URL params
    const { searchParams } = new URL(request.url);
    const tokenAddress = searchParams.get('tokenAddress');
    const chainId = searchParams.get('chainId') 
      ? parseInt(searchParams.get('chainId') || '8453', 10) 
      : 8453;

    // Validate token address
    if (!tokenAddress) {
      return NextResponse.json({ 
        error: 'Token address is required' 
      }, { status: 400 });
    }

    // Initialize AgentKit service
    const agentService = new AgentService();
    
    // Get token information
    const token = await agentService.getToken(tokenAddress, chainId);

    return NextResponse.json({
      success: true,
      data: token
    });
  } catch (error) {
    console.error('Error in AgentKit token info:', error);
    return NextResponse.json({ 
      error: 'Failed to get token information',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 