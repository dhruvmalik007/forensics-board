import { NextRequest, NextResponse } from 'next/server';
import { handlePrivyAuth } from '@/lib/auth/privy-auth-handler';

/**
 * API route to handle Privy authentication
 * This endpoint is called when a user logs in with Privy
 */
export async function POST(request: NextRequest) {
  try {
    const { privyDID, email, walletAddress } = await request.json();

    if (!privyDID) {
      return NextResponse.json(
        { error: 'Missing required field: privyDID' },
        { status: 400 }
      );
    }

    // Get IP address from request
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1';
    
    // Get user agent from request
    const userAgent = request.headers.get('user-agent') || '';

    // Handle Privy authentication
    const user = await handlePrivyAuth({
      privyDID,
      email,
      walletAddress,
      ipAddress,
      userAgent
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to authenticate user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Error handling Privy authentication:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate user' },
      { status: 500 }
    );
  }
} 