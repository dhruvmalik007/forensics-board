'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeft } from 'lucide-react';
import { TransactionSessionsSidebar } from '@/components/blockchain-explorer/transaction-sessions-sidebar';
import { usePrivyAuthWithDB } from '@/hooks/use-privy-auth-with-db';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';

import { Toggle } from '@/components/ui/toggle';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = usePrivyAuthWithDB();
  const pathname = usePathname();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/';
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <Sidebar className="border-r border-gray-800">
          <SidebarHeader className="border-b border-gray-800 px-4 py-3">
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
              <span className="text-lg font-semibold text-white">Forensics</span>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="px-2 py-4">
            <TransactionSessionsSidebar />
          </SidebarContent>
          
          <SidebarFooter className="border-t border-gray-800 p-4">
            <div className="flex flex-col space-y-2">
              <Link 
                href="/"
                className="w-full py-2 px-3 rounded-md bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors flex items-center justify-center"
              >
                Back to Home
              </Link>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 flex items-center p-4">
            <Toggle>
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Sidebar</span>
            </Toggle>
            <div className="ml-4">
              <h1 className="text-xl font-semibold text-white">Blockchain Explorer Dashboard</h1>
            </div>
          </div>
          
          <main className="p-4">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
} 