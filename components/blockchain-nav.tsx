'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, History, BarChart3, Settings } from 'lucide-react';

export function BlockchainNav() {
  const pathname = usePathname();
  
  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      name: 'Explorer',
      href: '/chat',
      icon: Search,
    },
    {
      name: 'History',
      href: '/chat/history',
      icon: History,
    },
    {
      name: 'Analytics',
      href: '/chat/analytics',
      icon: BarChart3,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="flex items-center justify-center bg-gray-800/50 rounded-lg p-1 mb-6">
      <nav className="flex space-x-1">
        {navItems.map((item) => {
          const isActive = 
            item.href === '/' 
              ? pathname === '/' 
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
              
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 