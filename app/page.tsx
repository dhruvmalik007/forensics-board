'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PricingBanner } from '@/components/ui/pricing-banner';
import { usePrivyAuth } from '@/hooks/use-privy-auth';
import { Loader2 } from 'lucide-react';
import { StatisticsSection } from '@/components/ui/statistics-section';
import { toast } from 'sonner';

export default function Page() {
  const { login, authenticated, ready } = usePrivyAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Simplified authentication check with relative paths
  useEffect(() => {
    if (!ready) return;
    
    // Check if user is already verified
    const isVerified = localStorage.getItem('selfVerified') === 'true';
    if (authenticated && isVerified) {
      window.location.href = '/dashboard';
    }
  }, [authenticated, ready]);

  const handleLoginWithSelf = async () => {
    if (isLoggingIn || isNavigating) return;
    
    setIsLoggingIn(true);
    try {
      await login();
      // After successful login, check if user is already verified
      const isVerified = localStorage.getItem('selfVerified') === 'true';
      if (isVerified) {
        setIsNavigating(true);
        window.location.href = '/dashboard';
      } else {
        setIsNavigating(true);
        window.location.href = '/verify';
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      setIsLoggingIn(false);
      setIsNavigating(false);
    }
  };

  const handleFreemiumAccess = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    
    // Show loading toast
    toast.loading('Preparing freemium access...', {
      duration: 2000,
    });
    
    // Navigate to the dedicated freemium page
    window.location.href = '/freemium';
  };

  // Show loading state for authentication or navigation
  if (!ready || isNavigating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>{isNavigating ? 'Redirecting to dashboard...' : 'Loading...'}</span>
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
          <nav className="hidden md:flex space-x-8">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`${activeTab === 'overview' ? 'text-blue-400' : 'text-gray-400'} hover:text-white transition`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('features')}
              className={`${activeTab === 'features' ? 'text-blue-400' : 'text-gray-400'} hover:text-white transition`}
            >
              Features
            </button>
            <button 
              onClick={() => setActiveTab('agents')}
              className={`${activeTab === 'agents' ? 'text-blue-400' : 'text-gray-400'} hover:text-white transition`}
            >
              Agents
            </button>
          </nav>
          <button
            onClick={handleLoginWithSelf}
            disabled={isLoggingIn}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl font-bold mb-6">Blockchain Intelligence Platform</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
            A powerful agentic application for comprehensive blockchain address analysis, combining LLMs with specialized blockchain data retrieval tools.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleLoginWithSelf}
              disabled={isLoggingIn}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Login and Verify using Self Protocol</span>
              )}
            </button>
            {/* Replace Link with button for consistency */}
            <button 
              onClick={handleFreemiumAccess}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors inline-flex items-center justify-center"
            >
              Testing with Freemium Features
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Banner */}
      <section className="py-16 bg-gray-800/30">
        <div className="container mx-auto px-4">
          <PricingBanner 
            onFreemiumClick={handleFreemiumAccess}
          />
        </div>
      </section>

      {/* Statistics Section - Using our new component */}
      <StatisticsSection />

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Wallet Analysis</h3>
              <p className="text-gray-400">Deep insights into wallet activities, relationships, and token movements.</p>
            </div>
            <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Trading Pattern Detection</h3>
              <p className="text-gray-400">Identify copy trading, pump and dump schemes, and insider trading patterns.</p>
            </div>
            <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Security Analysis</h3>
              <p className="text-gray-400">Comprehensive security analysis for tokens and smart contracts.</p>
            </div>
            <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Identity Resolution</h3>
              <p className="text-gray-400">Connect on-chain identities with real-world entities using ENS, social media, and more.</p>
            </div>
            <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-Chain Support</h3>
              <p className="text-gray-400">Analyze wallets and transactions across multiple blockchain networks.</p>
            </div>
            <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Chat</h3>
              <p className="text-gray-400">Conversational interface for natural language blockchain analysis queries.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
              <span className="text-lg font-semibold">Blockchain Forensics</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 