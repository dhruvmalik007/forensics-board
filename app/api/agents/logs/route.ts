import { NextRequest, NextResponse } from 'next/server';
import { 
  createAgentExecutionLog,
  getAgentExecutionLogsBySessionId
} from '@/lib/db/queries';

/**
 * API route to create a new agent execution log
 * This endpoint is called when an agent performs a step in its execution
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      agentSessionId, 
      stepId, 
      stepName, 
      status, 
      message, 
      metadata 
    } = await request.json();

    if (!agentSessionId || !stepId || !stepName || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: agentSessionId, stepId, stepName, or status' },
        { status: 400 }
      );
    }

    // Create a new agent execution log
    const log = await createAgentExecutionLog({
      agentSessionId,
      stepId,
      stepName,
      status,
      message,
      metadata
    });

    return NextResponse.json({ 
      success: true,
      log
    });
  } catch (error) {
    console.error('Error creating agent execution log:', error);
    return NextResponse.json(
      { error: 'Failed to create agent execution log' },
      { status: 500 }
    );
  }
}

/**
 * API route to get agent execution logs by session ID
 * This endpoint is called to retrieve the execution logs for a specific agent session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: sessionId' },
        { status: 400 }
      );
    }

    // Get agent execution logs by session ID
    const logs = await getAgentExecutionLogsBySessionId(sessionId);

    return NextResponse.json({ 
      success: true,
      logs
    });
  } catch (error) {
    console.error('Error getting agent execution logs:', error);
    return NextResponse.json(
      { error: 'Failed to get agent execution logs' },
      { status: 500 }
    );
  }
} 