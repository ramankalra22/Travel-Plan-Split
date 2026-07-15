/**
 * src/app/providers.js
 * Client-side providers wrapper (NextAuth SessionProvider)
 */
'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
