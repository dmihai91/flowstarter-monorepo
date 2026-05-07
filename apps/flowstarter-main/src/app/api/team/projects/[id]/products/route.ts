import { NextRequest, NextResponse } from 'next/server';
import { requireTeamAuth } from '@/lib/api-auth';
import { validateCommerceProductInput } from '@/lib/commerce-products';
import { syncCommerceProductCount } from '@/lib/commerce-product-counts';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

const admin = createSupabaseServiceRoleClient;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireTeamAuth();
  if (!authCheck.authorized) return authCheck.response;

  const { id: workspaceId } = await params;

  const { data, error } = await admin()
    .from('commerce_products')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireTeamAuth();
  if (!authCheck.authorized) return authCheck.response;

  const { id: workspaceId } = await params;
  const body = await req.json().catch(() => ({}));

  const validation = validateCommerceProductInput(body);
  if (!validation.ok) {
    return NextResponse.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 400 }
    );
  }

  const supabase = admin();

  const { data: workspace, error: wsErr } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .single();
  if (wsErr || !workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('commerce_products')
    .insert({ workspace_id: workspaceId, ...validation.record })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A product with that slug already exists for this workspace' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await syncCommerceProductCount(supabase, workspaceId);

  return NextResponse.json({ product: data }, { status: 201 });
}
