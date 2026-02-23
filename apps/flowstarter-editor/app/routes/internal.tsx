/**
 * Internal Layout - Team Only Access
 * 
 * This layout wraps all /internal/* routes and restricts access
 * to team members only (Darius, Dorin).
 */

import { Outlet, useLoaderData } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';

// Team member emails - only these users can access internal routes
const TEAM_EMAILS = [
  'darius@flowstarter.com',
  'dorin@flowstarter.com',
  'dmihai91@gmail.com', // Darius personal
];

export async function loader({ request }: LoaderFunctionArgs) {
  // TODO: Implement actual auth check when auth is set up
  // For now, we'll use an environment variable to enable/disable internal mode
  const isInternalEnabled = process.env.INTERNAL_MODE === 'true';
  
  if (!isInternalEnabled) {
    // If internal mode is disabled, redirect to home
    throw redirect('/');
  }
  
  // TODO: Check user email from session/auth
  // const user = await getUser(request);
  // if (!user || !TEAM_EMAILS.includes(user.email)) {
  //   throw redirect('/');
  // }
  
  return json({ 
    mode: 'internal',
    teamEmails: TEAM_EMAILS,
  });
}

export default function InternalLayout() {
  const { mode } = useLoaderData<typeof loader>();
  
  return (
    <div className="internal-layout">
      {/* Internal mode banner */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '32px',
          backgroundColor: '#7c3aed',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 500,
          zIndex: 9999,
          gap: '8px',
        }}
      >
        <span>🔧</span>
        <span>Internal Mode — Team Only</span>
        <span style={{ opacity: 0.7 }}>|</span>
        <span style={{ opacity: 0.7 }}>Full Editor Access</span>
      </div>
      
      {/* Content with padding for banner */}
      <div style={{ paddingTop: '32px', height: '100vh' }}>
        <Outlet />
      </div>
    </div>
  );
}
