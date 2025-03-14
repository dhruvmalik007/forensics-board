import { NextRequest, NextResponse } from 'next/server';
import { SelfBackendVerifier, countryCodes, getUserIdentifier } from '@selfxyz/core';
import { updateUserVerification } from '@/lib/auth/privy-auth-handler';
import { getUserByPrivyDID } from '@/lib/db/queries';

// Define the scope for the Self Protocol verification
const SELF_SCOPE = 'self-playground';

/**
 * API route to handle Self Protocol verification
 * This endpoint is called when a user completes the Self Protocol verification process
 */
export async function POST(request: NextRequest) {
  try {
    const { proof, publicSignals, privyDID } = await request.json();

    if (!proof || !publicSignals) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: proof or publicSignals' },
        { status: 400 }
      );
    }

    // Extract user ID from the proof
    const userId = await getUserIdentifier(publicSignals);
    console.log("Extracted userId from proof:", userId);

    // Initialize and configure the verifier
    const selfBackendVerifier = new SelfBackendVerifier(
      'https://forno.celo.org', // Celo RPC url
      SELF_SCOPE, // The scope that identifies your app,
      "hex",
      true
    );
    
    // Configure verification options
    selfBackendVerifier.setMinimumAge(18);
    selfBackendVerifier.excludeCountries(
      countryCodes.IRN,   // Iran
      countryCodes.PRK    // North Korea
    );
    selfBackendVerifier.enableNameAndDobOfacCheck();

    // Verify the proof
    const result = await selfBackendVerifier.verify(proof, publicSignals);
    
    if (result.isValid) {
      // If privyDID is provided, update the user's verification status in the database
      if (privyDID) {
        const user = await getUserByPrivyDID(privyDID);
        
        if (user) {
          await updateUserVerification({
            userId: user.id,
            isVerified: true
          });
        }
      }
      
      // Return successful verification response
      return NextResponse.json({
        success: true,
        result: true,
        credentialSubject: result.credentialSubject
      });
    } else {
      // Return failed verification response
      return NextResponse.json({
        success: false,
        result: false,
        message: 'Verification failed',
        details: result.isValidDetails
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying proof:', error);
    return NextResponse.json({
      success: false,
      result: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 