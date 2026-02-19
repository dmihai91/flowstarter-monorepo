import { useServerSupabaseWithAuth } from '@/hooks/useServerSupabase';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, message, email } = body;

    // Validate required fields
    if (!category || !message) {
      return NextResponse.json(
        { error: 'Category and message are required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['bug', 'feature', 'improvement', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Validate message length
    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'Message must not exceed 5000 characters' },
        { status: 400 }
      );
    }

    const supabase = await useServerSupabaseWithAuth();

    const { data, error } = await supabase
      .from('user_feedback')
      .insert({
        user_id: userId,
        category,
        message: message.trim(),
        email: email || null,
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      console.error('Feedback submission error:', error);
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await useServerSupabaseWithAuth();

    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Feedback fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Feedback fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
