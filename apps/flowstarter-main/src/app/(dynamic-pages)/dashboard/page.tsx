import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

// Stopgap router for /dashboard while the per-workspace editor subdomain
// (`{slug}.flowstarter.net`) handoff for clients is still being wired up.
// Until then, every authenticated user lands on the operator console so
// stale links (Navbar logo, Clerk defaults, login redirects) resolve.
export default async function DashboardIndexPage() {
  const { userId } = await auth();
  if (!userId) redirect('/login?next=/dashboard');
  redirect('/admin/dashboard');
}
