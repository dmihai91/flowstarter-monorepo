import { useServerSupabase } from '@/hooks/useServerSupabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create Supabase client
    const supabase = useServerSupabase();

    // Simple query to test database connection
    // Using a lightweight query that should work on any Supabase instance
    const { error } = await supabase
      .from('projects') // Replace with any table that exists in your schema
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('Database health check failed:', error);
      return NextResponse.json(
        {
          status: 'error',
          message: 'Database connection failed',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      database: 'supabase',
    });
  } catch (error) {
    console.error('Database health check error:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

// Also support HEAD requests for quick checks
export async function HEAD() {
  try {
    const supabase = useServerSupabase();
    const { error } = await supabase
      .from('projects')
      .select('count', { count: 'exact', head: true });

    if (error) {
      return new NextResponse(null, { status: 503 });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
