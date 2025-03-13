import { 
  createPrivyUser, 
  getUserByPrivyDID, 
  updateUserWalletAddress, 
  updateUserVerificationStatus,
  createUserSession
} from '@/lib/db/queries';

/**
 * Handles user authentication with Privy
 * This function should be called when a user logs in with Privy
 */
export async function handlePrivyAuth({
  privyDID,
  email,
  walletAddress,
  ipAddress,
  userAgent
}: {
  privyDID: string;
  email?: string;
  walletAddress?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    // Check if user already exists
    const existingUser = await getUserByPrivyDID(privyDID);
    
    if (existingUser) {
      // User exists, update wallet address if provided and different
      if (walletAddress && existingUser.walletAddress !== walletAddress) {
        await updateUserWalletAddress({
          userId: existingUser.id,
          walletAddress
        });
      }
      
      // Create a new session
      await createUserSession({
        userId: existingUser.id,
        loginMethod: walletAddress ? 'wallet' : 'email',
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
      
      return existingUser;
    } else {
      // Create new user
      const result = await createPrivyUser({
        privyDID,
        email,
        walletAddress
      });
      
      // Get the newly created user
      const newUser = await getUserByPrivyDID(privyDID);
      
      if (newUser) {
        // Create a new session
        await createUserSession({
          userId: newUser.id,
          loginMethod: walletAddress ? 'wallet' : 'email',
          ipAddress,
          userAgent,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });
      }
      
      return newUser;
    }
  } catch (error) {
    console.error('Error handling Privy authentication:', error);
    throw error;
  }
}

/**
 * Updates user verification status after Self Protocol verification
 */
export async function updateUserVerification({
  userId,
  isVerified
}: {
  userId: string;
  isVerified: boolean;
}) {
  try {
    await updateUserVerificationStatus({
      userId,
      isVerified
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user verification status:', error);
    throw error;
  }
} 