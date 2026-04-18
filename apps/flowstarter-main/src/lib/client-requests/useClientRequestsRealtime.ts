'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

function getBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  browserClient = createClient(url, anon, {
    auth: { persistSession: false },
  });
  return browserClient;
}

export function useClientRequestsRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel('client-requests-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'client_requests' },
        (payload) => {
          qc.invalidateQueries({ queryKey: ['client-requests'] });
          qc.invalidateQueries({ queryKey: ['client-request-stats'] });

          if (
            payload.eventType === 'INSERT' &&
            typeof document !== 'undefined' &&
            document.visibilityState === 'hidden' &&
            typeof Notification !== 'undefined' &&
            Notification.permission === 'granted'
          ) {
            const req = payload.new as { title?: string };
            new Notification('New client request', {
              body: req.title ?? 'A client has submitted a new request',
              tag: 'client-request',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
