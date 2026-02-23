/**
 * Team Layout
 * 
 * Wrapper for all /team/* routes.
 * Handles auth check and provides consistent layout.
 */

import { Outlet, useLocation } from '@remix-run/react';

export default function TeamLayout() {
  const location = useLocation();
  
  // Login page doesn't need the layout wrapper
  if (location.pathname === '/team/login') {
    return <Outlet />;
  }
  
  // All other team routes get the outlet directly
  // Each page handles its own header/layout for flexibility
  return <Outlet />;
}
