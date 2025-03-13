'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { QrCode, Check, Loader2, X, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePrivyAuth } from '@/hooks/use-privy-auth';

type VerificationStatus = 'idle' | 'no-wallet' | 'pending' | 'success' | 'error';

export function SelfVerification({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const { user, connectWallet } = usePrivyAuth();
  
  // Check if user has a wallet address
  useEffect(() => {
    if (open) {
      const walletAddress = user?.wallet?.address;
      if (!walletAddress) {
        setVerificationStatus('no-wallet');
      } else if (verificationStatus === 'no-wallet') {
        // If wallet is now connected, reset to idle state
        setVerificationStatus('idle');
      }
    }
  }, [open, user, verificationStatus]);

  const handleConnectWallet = async () => {
    setIsConnectingWallet(true);
    try {
      const success = await connectWallet();
      if (success) {
        toast.success('Wallet connected successfully');
        setVerificationStatus('idle');
      }
    } catch (error) {
      toast.error('Failed to connect wallet. Please try again.');
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleStartVerification = async () => {
    const walletAddress = user?.wallet?.address;
    
    if (!walletAddress) {
      setVerificationStatus('no-wallet');
      return;
    }
    
    setVerificationStatus('pending');
    
    try {
      // Call the Self Protocol verification API
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          privyDID: user.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Verification API call failed');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setVerificationStatus('success');
        toast.success('Identity verified successfully!');
        
        // Store verification status in localStorage for UI purposes
        localStorage.setItem('selfVerified', 'true');
        
        // Close the dialog after a delay
        setTimeout(() => {
          onOpenChange(false);
          setVerificationStatus('idle');
          
          // Refresh the page to update UI based on verification status
          window.location.reload();
        }, 2000);
      } else {
        setVerificationStatus('error');
        setErrorMessage(data.error || 'Verification failed. Please try again.');
        toast.error(data.error || 'Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      setErrorMessage('An error occurred during verification. Please try again.');
      toast.error('An error occurred during verification. Please try again.');
    }
  };

  const resetVerificationStatus = () => {
    if (!open) {
      // Reset status when dialog is closed
      setTimeout(() => {
        setVerificationStatus('idle');
        setErrorMessage('');
      }, 300);
    }
  };

  useEffect(() => {
    resetVerificationStatus();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Your Identity</DialogTitle>
          <DialogDescription>
            Verify your identity using Self Protocol to access premium features.
          </DialogDescription>
        </DialogHeader>
        
        {verificationStatus === 'no-wallet' && (
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-center">Wallet Connection Required</h3>
            <p className="text-sm text-center text-muted-foreground">
              You need to connect a wallet to verify your identity with Self Protocol.
            </p>
            <Button 
              onClick={handleConnectWallet} 
              className="w-full"
              disabled={isConnectingWallet}
            >
              {isConnectingWallet ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting Wallet...
                </>
              ) : (
                'Connect Wallet'
              )}
            </Button>
          </div>
        )}
        
        {verificationStatus === 'idle' && (
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
              <QrCode className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Click the button below to start the verification process. You'll need to confirm the transaction in your wallet.
            </p>
            <Button onClick={handleStartVerification} className="w-full">Start Verification</Button>
          </div>
        )}
        
        {verificationStatus === 'pending' && (
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
            <p className="text-sm text-center font-medium">Verifying your identity...</p>
            <p className="text-xs text-center text-muted-foreground">This may take a moment. Please don't close this window.</p>
          </div>
        )}
        
        {verificationStatus === 'success' && (
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-center">Verification Successful!</h3>
            <p className="text-sm text-center text-muted-foreground">
              Your identity has been verified. You now have access to premium features.
            </p>
          </div>
        )}
        
        {verificationStatus === 'error' && (
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-center">Verification Failed</h3>
            <p className="text-sm text-center text-muted-foreground">
              {errorMessage || 'An error occurred during verification. Please try again.'}
            </p>
            <Button onClick={handleStartVerification} variant="outline" className="w-full">Try Again</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 