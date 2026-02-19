/**
 * Redirect handler for legacy /chat/:id URLs to /project/:id
 * This ensures backwards compatibility with old URLs.
 */
import { redirect, type LoaderFunctionArgs } from '@remix-run/cloudflare';

export const loader = ({ params }: LoaderFunctionArgs) => {
  const { conversationId } = params;

  // Redirect to the new /project/ URL
  return redirect(`/project/${conversationId}`, { status: 301 });
};

export default function ChatRedirect() {
  // This shouldn't render as the loader redirects, but just in case
  return null;
}
