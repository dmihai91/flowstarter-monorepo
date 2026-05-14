import { cookies } from 'next/headers';
import TeamAdminLayoutClient from './TeamAdminLayoutClient';

const SIDEBAR_COOKIE = 'dashboard-sidebar-collapsed-v2';

function parseSidebarCollapsedCookie(raw: string | undefined): boolean | null {
  if (raw === undefined) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'boolean' ? parsed : null;
  } catch {
    return null;
  }
}

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const fromCookie = parseSidebarCollapsedCookie(
    cookieStore.get(SIDEBAR_COOKIE)?.value
  );
  const initialSidebarCollapsed = fromCookie === true;

  return (
    <TeamAdminLayoutClient initialSidebarCollapsed={initialSidebarCollapsed}>
      {children}
    </TeamAdminLayoutClient>
  );
}
