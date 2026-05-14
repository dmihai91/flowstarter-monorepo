import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId, sessionClaims } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let role = (
    sessionClaims?.metadata as { role?: string }
  )?.role?.toLowerCase();
  if (!role) {
    const user = await currentUser();
    role = (user?.publicMetadata as { role?: string })?.role?.toLowerCase();
  }
  if (role !== 'team' && role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const clerk = await clerkClient();
  const { data: users } = await clerk.users.getUserList({ limit: 200 });
  const members = users
    .filter((u) => {
      const r = (u.publicMetadata as { role?: string })?.role?.toLowerCase();
      return r === 'team' || r === 'admin';
    })
    .map((u) => ({
      id: u.id,
      name: [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Unknown',
      email: u.emailAddresses[0]?.emailAddress ?? '',
      role: (u.publicMetadata as { role?: string })?.role ?? 'team',
      createdAt: new Date(u.createdAt).toISOString(),
      lastSignIn: u.lastSignInAt
        ? new Date(u.lastSignInAt).toISOString()
        : null,
    }));
  return NextResponse.json({ members });
}
