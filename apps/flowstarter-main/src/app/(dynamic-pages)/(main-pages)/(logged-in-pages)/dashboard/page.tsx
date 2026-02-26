import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  // Redirect to team dashboard (concierge pivot)
  redirect('/team/dashboard');
}
