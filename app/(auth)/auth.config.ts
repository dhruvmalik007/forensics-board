import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/',
    newUser: '/',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnChat = nextUrl.pathname.startsWith('/chat');
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isOnCallback = nextUrl.pathname.startsWith('/callback');
      const isOnRoot = nextUrl.pathname === '/';

      // Since we can't access cookies here, we'll rely on the auth object
      // The middleware will handle Privy token checks
      const isEffectivelyLoggedIn = isLoggedIn;

      if (isEffectivelyLoggedIn && (isOnRoot || isOnRegister)) {
        return Response.redirect(new URL('/chat', nextUrl as unknown as URL));
      }

      if (isOnRegister || isOnCallback || isOnRoot) {
        return true; // Always allow access to register, callback, and root pages
      }

      if (isOnChat) {
        if (isEffectivelyLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      if (isEffectivelyLoggedIn) {
        return Response.redirect(new URL('/chat', nextUrl as unknown as URL));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
