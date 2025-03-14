'use client';

import { useEffect, useState } from 'react';
import { usePrivy, useWallets, useLogin } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UserData {
  id: string;
  email?: string;
  walletAddress?: string;
  isVerified: boolean;
}

export function usePrivyAuthWithDB() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { wallets } = useWallets();
  const { login: privyLogin } = useLogin();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync user data with database when authenticated
  useEffect(() => {
    async function syncUserWithDB() {
      if (ready && authenticated && user) {
        try {
          setIsLoading(true);
          
          // Get the wallet address if available
          const walletAddress = wallets.length > 0 ? wallets[0].address : undefined;
          
          // Sync user with database
          const response = await fetch('/api/auth/privy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              privyDID: user.id,
              email: user.email?.address,
              walletAddress
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to sync user with database');
          }

          const data = await response.json();
          
          if (data.success && data.user) {
            setUserData(data.user);
            
            // If user is verified, redirect to dashboard
            if (data.user.isVerified) {
              router.push('/dashboard');
            } else {
              // If not verified, redirect to verify page
              router.push('/verify');
            }
          }
        } catch (error) {
          console.error('Error syncing user with database:', error);
          toast.error('Failed to sync user data. Please try again.');
        } finally {
          setIsLoading(false);
        }
      } else if (ready && !authenticated) {
        setUserData(null);
        setIsLoading(false);
      }
    }

    syncUserWithDB();
  }, [ready, authenticated, user, wallets, router]);

  // Function to update user verification status
  const updateVerificationStatus = async (isVerified: boolean) => {
    if (!user) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privyDID: user.id,
          isVerified
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update verification status');
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        setUserData(data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast.error('Failed to update verification status. Please try again.');
      return false;
    }
  };

  // Function to handle login
  const login = async () => {
    try {
      // This will trigger the Privy login flow
      // After successful login, the useEffect above will sync the user with the database
      await privyLogin();
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Function to handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setUserData(null);
      router.push('/');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };

  return {
    ready,
    authenticated,
    user: userData,
    privyUser: user,
    isLoading,
    login,
    logout: handleLogout,
    updateVerificationStatus
  };
} 