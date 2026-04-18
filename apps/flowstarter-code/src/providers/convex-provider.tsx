'use client';

import { ConvexProvider as BaseConvexProvider, ConvexReactClient } from 'convex/react';
import { type ReactNode, useMemo } from 'react';

let clientSingleton: ConvexReactClient | null = null;

function getConvexClient(): ConvexReactClient | null {
  if (typeof window === 'undefined') return null;

  if (!clientSingleton) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (url) {
      clientSingleton = new ConvexReactClient(url);
    }
  }

  return clientSingleton;
}

export function ConvexProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => getConvexClient(), []);

  if (!client) {
    // Convex not configured — render children without provider.
    // API routes use ConvexHttpClient independently.
    return <>{children}</>;
  }

  return <BaseConvexProvider client={client}>{children}</BaseConvexProvider>;
}
