import { NextRequest, NextResponse } from 'next/server';
import { 
  createBlockchainExploration,
  updateBlockchainExplorationStatus,
  getBlockchainExplorationsByUserId,
  getUserByPrivyDID,
  deleteBlockchainExploration
} from '@/lib/db/queries';

/**
 * API route to create a new blockchain exploration
 * This endpoint is called when a user initiates a blockchain exploration
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      privyDID, 
      documentId, 
      query, 
      address, 
      network 
    } = await request.json();

    if (!privyDID || !documentId || !query) {
      return NextResponse.json(
        { error: 'Missing required fields: privyDID, documentId, or query' },
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

    // Create a new blockchain exploration
    const exploration = await createBlockchainExploration({
      userId: user.id,
      documentId,
      query,
      address,
      network
    });

    return NextResponse.json({ 
      success: true,
      exploration
    });
  } catch (error) {
    console.error('Error creating blockchain exploration:', error);
    return NextResponse.json(
      { error: 'Failed to create blockchain exploration' },
      { status: 500 }
    );
  }
}

/**
 * API route to update a blockchain exploration status
 * This endpoint is called when a blockchain exploration status changes
 */
export async function PATCH(request: NextRequest) {
  try {
    const { id, status, results } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: id or status' },
        { status: 400 }
      );
    }

    // Update the blockchain exploration status
    await updateBlockchainExplorationStatus({
      id,
      status,
      results
    });

    return NextResponse.json({ 
      success: true
    });
  } catch (error) {
    console.error('Error updating blockchain exploration status:', error);
    return NextResponse.json(
      { error: 'Failed to update blockchain exploration status' },
      { status: 500 }
    );
  }
}

/**
 * API route to get blockchain explorations by user ID
 * This endpoint is called to retrieve the blockchain explorations for a specific user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const privyDID = searchParams.get('privyDID');

    if (!privyDID) {
      return NextResponse.json(
        { error: 'Missing required query parameter: privyDID' },
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

    // Get blockchain explorations by user ID
    const explorations = await getBlockchainExplorationsByUserId(user.id);

    return NextResponse.json({ 
      success: true,
      explorations
    });
  } catch (error) {
    console.error('Error getting blockchain explorations:', error);
    return NextResponse.json(
      { error: 'Failed to get blockchain explorations' },
      { status: 500 }
    );
  }
}

/**
 * API route to delete a blockchain exploration
 * This endpoint is called when a user wants to delete a blockchain exploration
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required query parameter: id' },
        { status: 400 }
      );
    }

    // Delete the blockchain exploration
    await deleteBlockchainExploration(id);

    return NextResponse.json({ 
      success: true
    });
  } catch (error) {
    console.error('Error deleting blockchain exploration:', error);
    return NextResponse.json(
      { error: 'Failed to delete blockchain exploration' },
      { status: 500 }
    );
  }
} 