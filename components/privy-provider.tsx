'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        loginMethods: ['email'],
        appearance: {
          theme: 'light',
          accentColor: '#000000',
          logo: 'https://your-logo-url.com/logo.png',
        }
      }}
    >
      {children}
    </PrivyProvider>
  );
} 