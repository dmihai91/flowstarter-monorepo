import { NextRequest, NextResponse } from 'next/server';
import { requireTeamAuth } from '@/lib/api-auth';
import { validateCommerceProductInput } from '@/lib/commerce-products';
import { syncCommerceProductCount } from '@/lib/commerce-product-counts';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

const admin = createSupabaseServiceRoleClient;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  const authCheck = await requireTeamAuth();
  if (!authCheck.authorized) return authCheck.response;

  const { id: workspaceId, productId } = await params;
  const body = await req.json().catch(() => ({}));

  const validation = validateCommerceProductInput(body, { partial: true });
  if (!validation.ok) {
    return NextResponse.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 400 }
    );
  }

  if (Object.keys(validation.record).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 }
    );
  }

  const supabase = admin();
  const { data, error } = await supabase
    .from('commerce_products')
    .update(validation.record)
    .eq('id', productId)
    .eq('workspace_id', workspaceId)
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
  if (!data) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({ product: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  const authCheck = await requireTeamAuth();
  if (!authCheck.authorized) return authCheck.response;

  const { id: workspaceId, productId } = await params;
  const supabase = admin();

  const { error } = await supabase
    .from('commerce_products')
    .delete()
    .eq('id', productId)
    .eq('workspace_id', workspaceId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await syncCommerceProductCount(supabase, workspaceId);

  return NextResponse.json({ success: true });
}
