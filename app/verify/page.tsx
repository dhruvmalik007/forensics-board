'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SelfVerification } from '@/components/self-verification';
import { Loader2, AlertCircle } from 'lucide-react';
import { usePrivyAuth } from '@/hooks/use-privy-auth';
import { Button } from '@/components/ui/button';

export default function VerifyPage() {
  const router = useRouter();
  const { ready, authenticated, user, logout, connectWallet } = usePrivyAuth();
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  useEffect(() => {
    if (ready) {
      setLoading(false);
      
      if (!authenticated) {
        router.push('/');
      } else if (user?.wallet?.address) {
        setWalletAddress(user.wallet.address);
      }
    }
  }, [ready, authenticated, user, router]);

  const handleVerificationComplete = (success: boolean) => {
    if (success) {
      // In a real implementation, you would store the verification status
      // in a database or localStorage
      localStorage.setItem('selfVerified', 'true');
      
      // Redirect to dashboard after successful verification
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    }
  };

  const handleSkipVerification = () => {
    toast.info('Proceeding without verification. Some features will be limited.');
    router.push('/dashboard');
  };

  const handleConnectWallet = async () => {
    setIsConnectingWallet(true);
    try {
      const success = await connectWallet();
      if (success) {
        // The wallet address will be updated in the next render cycle via the useEffect
        toast.success('Wallet connected successfully');
      }
    } catch (error) {
      toast.error('Failed to connect wallet. Please try again.');
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 size={40} className="animate-spin text-blue-500" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
            <h1 className="text-2xl font-bold">Blockchain Forensics</h1>
          </div>
          <button
            onClick={() => logout()}
            className="bg-transparent border border-gray-600 hover:border-gray-400 text-white px-5 py-2 rounded-lg font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-gray-800/30 rounded-xl border border-gray-700 p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">Verify Your Identity</h1>
          
          <div className="mb-8">
            <p className="text-gray-300 mb-6 text-center">
              You're logged in! To access all features, please verify your identity using Self Protocol.
            </p>
            
            <div className="bg-gray-800/50 p-6 rounded-lg mb-6">
              <h2 className="text-xl font-semibold mb-4">Your Wallet</h2>
              {walletAddress ? (
                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-gray-400">Connected Wallet Address:</p>
                  <div className="bg-gray-900 p-3 rounded font-mono text-sm break-all">
                    {walletAddress}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center gap-2 text-yellow-500">
                    <AlertCircle size={20} />
                    <p className="font-medium">No Wallet Connected</p>
                  </div>
                  <p className="text-sm text-gray-400">
                    You need to connect a wallet to verify your identity with Self Protocol.
                  </p>
                  <Button 
                    onClick={handleConnectWallet}
                    disabled={isConnectingWallet}
                    className="w-full sm:w-auto"
                  >
                    {isConnectingWallet ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect Wallet'
                    )}
                  </Button>
                </div>
              )}
            </div>
            
            <div className="bg-gray-800/50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Identity Verification</h2>
              <p className="text-gray-400 mb-6">
                Verify your identity using Self Protocol to unlock all features of the platform.
                This process is secure and your data remains private.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <SelfVerification onVerificationComplete={handleVerificationComplete} />
                
                <button
                  onClick={handleSkipVerification}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-lg font-medium transition-colors"
                >
                  Skip Verification
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>
              By verifying your identity, you agree to our{' '}
              <a href="#" className="text-blue-400 hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 