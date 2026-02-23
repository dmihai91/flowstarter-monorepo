/**
 * Internal Index - Redirects to /internal/new
 */

import { redirect } from '@remix-run/cloudflare';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

export async function loader({ request }: LoaderFunctionArgs) {
  // Redirect to new project creation
  throw redirect('/internal/new');
}

export default function InternalIndex() {
  return null;
}
