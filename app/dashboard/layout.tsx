'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePrivyAuthWithDB } from '@/hooks/use-privy-auth-with-db';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = usePrivyAuthWithDB();
  const [isFreemium, setIsFreemium] = useState(false);
  
  useEffect(() => {
    // Check if in freemium mode
    const freemiumEnabled = localStorage.getItem('freemiumEnabled') === 'true';
    setIsFreemium(freemiumEnabled);
    
    // Only redirect if not authenticated AND not in freemium mode
    if (!isLoading && !user && !freemiumEnabled) {
      window.location.href = '/';
    }
  }, [user, isLoading]);

  // Show loading only if authenticating AND not in freemium mode
  if (isLoading && !isFreemium) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-b from-gray-900 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-gray-900 to-black overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 py-2 px-4 flex items-center justify-between">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
          <h1 className="text-xl font-bold">Blockchain Forensics</h1>
        </div>
        <div className="flex items-center space-x-2">
          {isFreemium && (
            <div className="px-3 py-2 text-xs text-amber-400 bg-amber-500/10 rounded-md">
              Freemium Mode
            </div>
          )}
          <Link 
            href="/"
            className="flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Return Home
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
