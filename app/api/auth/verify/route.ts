import { NextRequest, NextResponse } from 'next/server';
import { updateUserVerification } from '@/lib/auth/privy-auth-handler';
import { getUserByPrivyDID } from '@/lib/db/queries';

/**
 * API route to handle Self Protocol verification
 * This endpoint is called when a user completes the Self Protocol verification process
 */
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, privyDID } = await request.json();

    if (!walletAddress || !privyDID) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: walletAddress or privyDID' },
        { status: 400 }
      );
    }

    // Get the user by Privy DID
    const user = await getUserByPrivyDID(privyDID);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // In a real implementation, this would call the Self Protocol API to verify the user
    // For demo purposes, we'll simulate a successful verification
    
    // Update the user's verification status in the database
    await updateUserVerification({
      userId: user.id,
      isVerified: true
    });

    return NextResponse.json({ 
      success: true,
      message: 'User verified successfully'
    });
  } catch (error) {
    console.error('Error verifying user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify user' },
      { status: 500 }
    );
  }
} 