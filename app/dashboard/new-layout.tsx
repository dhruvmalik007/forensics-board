'use client';

import { useState, useEffect } from 'react';
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <main className="h-screen">
        {children}
      </main>
    </div>
  );
}
