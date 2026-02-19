import { createClient } from '@/supabase-clients/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useState } from 'react';

// Global instance outside of components to maintain singleton pattern
let globalSupabaseClient: SupabaseClient | null = null;

// For client components only (with auth persistence)
export const useSupabaseClient = () => {
  const [supabaseClient] = useState(() => {
    if (!globalSupabaseClient) {
      globalSupabaseClient = createClient();
    }
    return globalSupabaseClient;
  });

  return supabaseClient;
};
