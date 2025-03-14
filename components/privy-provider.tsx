'use client';

import * as React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

export function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#3B82F6', // Blue color to match our UI
          logo: '/logo.png', // Make sure to add a logo file to the public directory
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        supportedChains: [
          {
            id: 1,
            name: 'Ethereum',
            rpcUrls: {
              default: {
                http: ['https://eth.llamarpc.com'],
              },
            },
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18,
            },
          },
          {
            id: 137,
            name: 'Polygon',
            rpcUrls: {
              default: {
                http: ['https://polygon.llamarpc.com'],
              },
            },
            nativeCurrency: {
              name: 'MATIC',
              symbol: 'MATIC',
              decimals: 18,
            },
          },
        ],
      }}
    >
      {children}
    </PrivyProvider>
  );
} 