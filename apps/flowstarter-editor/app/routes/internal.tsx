/**
 * Internal Entry Point
 * Redirects to team login
 */

import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function loader({ request }: LoaderFunctionArgs) {
  return redirect('/team/login');
}
