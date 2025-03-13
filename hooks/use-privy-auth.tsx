'use client';

import { useEffect } from 'react';
import { usePrivy, useLogin, useWallets, useConnectWallet } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function usePrivyAuth() {
  const { ready, authenticated, user, logout } = usePrivy();
  const router = useRouter();
  const { wallets } = useWallets();
  const { connectWallet } = useConnectWallet();
  
  // Use the useLogin hook to handle login success
  const { login } = useLogin({
    onComplete: ({ user, isNewUser, wasAlreadyAuthenticated }) => {
      // Redirect to the verify page after successful login
      router.push('/verify');
    },
    onError: (error) => {
      // Handle different error types
      if (error === 'exited_auth_flow') {
        // User manually exited the auth flow - this is a normal user action
        // We can either show a subtle toast or just silently handle it
        console.log('User exited the authentication flow');
      } else {
        // For other errors, show a more prominent error message
        console.error('Login error:', error);
        toast.error('Authentication failed. Please try again.');
      }
    }
  });
  
  // Check if the user is already authenticated and redirect accordingly
  useEffect(() => {
    if (ready && authenticated) {
      // Check if the user has already been verified with Self Protocol
      const isSelfVerified = localStorage.getItem('selfVerified') === 'true';
      
      if (isSelfVerified) {
        // If already verified, redirect to dashboard
        router.push('/dashboard');
      } else {
        // If not verified, redirect to verify page
        router.push('/verify');
      }
    }
  }, [ready, authenticated, router]);
  
  // Function to handle wallet connection
  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      toast.success('Wallet connected successfully');
      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
      return false;
    }
  };
  
  return {
    ready,
    authenticated,
    user,
    login,
    logout,
    wallets,
    connectWallet: handleConnectWallet
  };
} 