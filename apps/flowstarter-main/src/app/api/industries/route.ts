import { useServerSupabase } from '@/hooks/useServerSupabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = useServerSupabase();

    // Attempt primary industries table
    const { data: industriesData, error: industriesError } = await supabase
      .from('industries')
      .select('id, translation_key')
      .order('translation_key', { ascending: true });

    if (industriesError) {
      console.error('Failed to fetch industries from DB:', industriesError);
      return NextResponse.json(
        { error: 'Failed to fetch industries' },
        { status: 500 }
      );
    }

    if (Array.isArray(industriesData) && industriesData.length > 0) {
      // Return translation keys instead of names for client-side translation
      return NextResponse.json(
        industriesData.map((i) => ({ id: i.id, key: i.translation_key }))
      );
    }

    // No data available in DB; return empty list (no hardcoded fallback)
    console.warn('Industries query returned no rows; returning empty list.');
    return NextResponse.json([]);
  } catch (error) {
    console.error('Failed to fetch industries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch industries' },
      { status: 500 }
    );
  }
}
