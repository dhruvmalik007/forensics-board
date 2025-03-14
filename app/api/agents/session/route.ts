import { NextRequest, NextResponse } from 'next/server';
import { 
  createAgentSession, 
  updateAgentSessionStatus,
  createAgentExecutionLog,
  getUserByPrivyDID
} from '@/lib/db/queries';

/**
 * API route to create a new agent session
 * This endpoint is called when a user starts interacting with an agent
 */
export async function POST(request: NextRequest) {
  try {
    const { privyDID, chatId, agentType, metadata } = await request.json();

    if (!privyDID || !chatId || !agentType) {
      return NextResponse.json(
        { error: 'Missing required fields: privyDID, chatId, or agentType' },
        { status: 400 }
      );
    }

    // Get the user by Privy DID
    const user = await getUserByPrivyDID(privyDID);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create a new agent session
    const session = await createAgentSession({
      userId: user.id,
      chatId,
      agentType,
      metadata
    });

    return NextResponse.json({ 
      success: true,
      session
    });
  } catch (error) {
    console.error('Error creating agent session:', error);
    return NextResponse.json(
      { error: 'Failed to create agent session' },
      { status: 500 }
    );
  }
}

/**
 * API route to update an agent session status
 * This endpoint is called when an agent session status changes
 */
export async function PATCH(request: NextRequest) {
  try {
    const { sessionId, status, metadata } = await request.json();

    if (!sessionId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId or status' },
        { status: 400 }
      );
    }

    // Update the agent session status
    await updateAgentSessionStatus({
      sessionId,
      status,
      metadata
    });

    return NextResponse.json({ 
      success: true
    });
  } catch (error) {
    console.error('Error updating agent session status:', error);
    return NextResponse.json(
      { error: 'Failed to update agent session status' },
      { status: 500 }
    );
  }
} 