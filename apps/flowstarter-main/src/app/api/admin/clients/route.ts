import { auth, currentUser } from '@clerk/nextjs/server';
import { quoteMajorFrom } from '@/lib/flowstarter/quote';
import { NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

/**
 * GET /api/admin/clients
 *
 * Groups workspaces by client (client_email or client_business_name) and
 * returns a per-client roll-up the team uses on the Clients tab.
 */
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

  const supabase = createSupabaseServiceRoleClient();
  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select(
      `id, name, concierge_stage, setup_fee, final_value_minor, created_at, updated_at,
       client_name, client_email, client_phone, client_business_name,
       tier_name, deploy_status, commerce_mode, commerce_product_type,
       commerce_provider, commerce_status, commerce_product_count`
    )
    .order('created_at', { ascending: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  type Group = {
    key: string;
    name: string;
    email: string;
    phone: string;
    businessName: string;
    projectCount: number;
    totalFee: number;
    stages: string[];
    tiers: string[];
    deployStatuses: string[];
    commerceProjectCount: number;
    commerceProductCount: number;
    commerceProviders: string[];
    commerceStatuses: string[];
    commerceProductTypes: string[];
    lastActivity: string;
  };

  const grouped = new Map<string, Group>();
  for (const w of workspaces ?? []) {
    const key =
      w.client_email || w.client_business_name || w.client_name || w.id;
    if (!key) continue;
    const ex = grouped.get(key);
    const ua = (w.updated_at ?? w.created_at) as string;
    const commerceMode = w.commerce_mode ?? 'none';
    const hasCommerce = commerceMode !== 'none';
    if (ex) {
      ex.projectCount++;
      ex.totalFee += quoteMajorFrom(w);
      ex.stages.push(w.concierge_stage ?? 'intake');
      ex.deployStatuses.push(w.deploy_status ?? 'pending');
      if (w.tier_name) ex.tiers.push(w.tier_name);
      if (hasCommerce) {
        ex.commerceProjectCount++;
        ex.commerceProductCount += Number(w.commerce_product_count ?? 0);
        ex.commerceProviders.push(w.commerce_provider ?? 'custom');
        ex.commerceStatuses.push(w.commerce_status ?? 'discovery');
        ex.commerceProductTypes.push(w.commerce_product_type ?? 'mixed');
      }
      if (ua > ex.lastActivity) ex.lastActivity = ua;
    } else {
      grouped.set(key, {
        key,
        name: w.client_name || w.client_business_name || '',
        email: w.client_email || '',
        phone: w.client_phone || '',
        businessName: w.client_business_name || '',
        projectCount: 1,
        totalFee: quoteMajorFrom(w),
        stages: [w.concierge_stage ?? 'intake'],
        tiers: w.tier_name ? [w.tier_name] : [],
        deployStatuses: [w.deploy_status ?? 'pending'],
        commerceProjectCount: hasCommerce ? 1 : 0,
        commerceProductCount: hasCommerce
          ? Number(w.commerce_product_count ?? 0)
          : 0,
        commerceProviders: hasCommerce ? [w.commerce_provider ?? 'custom'] : [],
        commerceStatuses: hasCommerce ? [w.commerce_status ?? 'discovery'] : [],
        commerceProductTypes: hasCommerce
          ? [w.commerce_product_type ?? 'mixed']
          : [],
        lastActivity: ua,
      });
    }
  }

  return NextResponse.json({
    clients: Array.from(grouped.values()).map((g) => ({
      ...g,
      tiers: Array.from(new Set(g.tiers)),
      commerceProviders: Array.from(new Set(g.commerceProviders)),
      commerceStatuses: Array.from(new Set(g.commerceStatuses)),
      commerceProductTypes: Array.from(new Set(g.commerceProductTypes)),
    })),
  });
}
