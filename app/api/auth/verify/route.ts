import { NextRequest, NextResponse } from 'next/server';
import { getUserByPrivyDID } from '@/lib/db/queries';
import { updateUserVerification } from '@/lib/auth/privy-auth-handler';

/**
 * API route to update user verification status
 * This endpoint is called when a user completes the verification process
 */
export async function POST(request: NextRequest) {
  try {
    const { privyDID, verified } = await request.json();

    if (!privyDID) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: privyDID' },
        { status: 400 }
      );
    }

    // Get the user from the database
    const user = await getUserByPrivyDID(privyDID);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update the user's verification status
    await updateUserVerification({
      userId: user.id,
      isVerified: verified === true
    });
    
    return NextResponse.json({
      success: true,
      message: 'User verification status updated successfully'
    });
  } catch (error) {
    console.error('Error updating user verification status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 