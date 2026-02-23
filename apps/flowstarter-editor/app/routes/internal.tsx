/**
 * Internal Entry Point
 * Redirects to team login
 */

import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';

export function loader({ request }: LoaderFunctionArgs) {
  return redirect('/team/login');
}
