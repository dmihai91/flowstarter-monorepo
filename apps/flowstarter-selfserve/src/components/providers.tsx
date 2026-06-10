'use client';

import React from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ThemeProvider } from './theme';
import { initAnalytics, track } from '@/lib/analytics';

// Convex holds live agent/build state. When NEXT_PUBLIC_CONVEX_URL is unset
// (e.g. pure mock-mode dev), components fall back to HTTP polling.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    initAnalytics();
    track('visit');
  }, []);

  const tree = <ThemeProvider>{children}</ThemeProvider>;
  return convex ? <ConvexProvider client={convex}>{tree}</ConvexProvider> : tree;
}
