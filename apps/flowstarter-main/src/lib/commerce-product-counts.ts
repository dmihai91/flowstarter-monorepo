import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export async function syncCommerceProductCount(
  supabase: SupabaseClient<Database>,
  workspaceId: string
): Promise<void> {
  const { count, error } = await supabase
    .from('commerce_products')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);
  if (error || count === null) return;
  await supabase
    .from('workspaces')
    .update({
      commerce_product_count: count,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workspaceId);
}
