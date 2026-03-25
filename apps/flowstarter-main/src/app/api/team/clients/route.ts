import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

export async function GET() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let role = (sessionClaims?.metadata as { role?: string })?.role?.toLowerCase();
  if (!role) { const user = await currentUser(); role = (user?.publicMetadata as { role?: string })?.role?.toLowerCase(); }
  if (role !== 'team' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = createSupabaseServiceRoleClient();
  const { data: projects, error } = await supabase
    .from('projects').select('id, name, status, user_id, setup_fee, created_at, updated_at')
    .not('status', 'eq', 'prefill').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const grouped = new Map<string, { userId: string; projectCount: number; totalFee: number; statuses: string[]; lastActivity: string; }>();
  for (const p of projects ?? []) {
    const uid = p.user_id; if (!uid) continue;
    const ex = grouped.get(uid);
    const ua = (p.updated_at ?? p.created_at) as string;
    if (ex) { ex.projectCount++; ex.totalFee += Number(p.setup_fee ?? 0); ex.statuses.push(p.status ?? 'draft'); if (ua > ex.lastActivity) ex.lastActivity = ua; }
    else grouped.set(uid, { userId: uid, projectCount: 1, totalFee: Number(p.setup_fee ?? 0), statuses: [p.status ?? 'draft'], lastActivity: ua });
  }

  const userIds = Array.from(grouped.keys());
  const userMap: Record<string, { name: string; email: string; phone: string }> = {};
  if (userIds.length > 0) {
    try {
      const clerk = await clerkClient();
      const { data: users } = await clerk.users.getUserList({ userId: userIds, limit: 200 });
      for (const u of users) userMap[u.id] = { name: [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Unknown', email: u.emailAddresses[0]?.emailAddress ?? '', phone: u.phoneNumbers?.[0]?.phoneNumber ?? '' };
    } catch { /* ignore */ }
  }
  return NextResponse.json({ clients: Array.from(grouped.values()).map(g => ({ ...g, ...(userMap[g.userId] ?? {}) })) });
}
