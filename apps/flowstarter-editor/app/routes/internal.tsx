/**
 * Internal Entry Point - Redirects to Team Login
 */

import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';

export async function loader({ request }: LoaderFunctionArgs) {
  // Redirect to team login page
  throw redirect('/team/login');
}

export default function Internal() {
  return null;
}
