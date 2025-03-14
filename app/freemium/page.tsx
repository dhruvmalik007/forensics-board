'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function FreemiumPage() {
  useEffect(() => {
    // Function to set up freemium and redirect
    const setupFreemium = () => {
      // Set freemium flag in localStorage
      localStorage.setItem('freemiumEnabled', 'true');
      
      // Clear any existing test address to ensure fresh start
      localStorage.removeItem('testAddress');
      
      // Redirect to dashboard with relative path
      window.location.href = '/dashboard';
    };
    
    // Run the setup with a small delay to ensure the component is mounted
    const timer = setTimeout(setupFreemium, 500);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <h1 className="text-xl font-semibold">Setting Up Freemium Access...</h1>
        <p className="text-gray-400">You'll be redirected to the dashboard in a moment.</p>
      </div>
    </div>
  );
} 