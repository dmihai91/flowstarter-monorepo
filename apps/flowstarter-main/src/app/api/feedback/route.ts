import { useServerSupabaseWithAuth } from '@/hooks/useServerSupabase';
import { sendEmail } from '@/lib/email';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const FEEDBACK_EMAIL = 'contact@flowstarter.app';

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

    // Get user details from Clerk
    let userName = 'Unknown User';
    let userEmail = email || null;
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.emailAddresses?.[0]?.emailAddress || 'Unknown User';
      userEmail = email || user.emailAddresses?.[0]?.emailAddress || null;
    } catch (e) {
      console.warn('Could not fetch user details from Clerk:', e);
    }

    // Save to database
    const { data, error } = await supabase
      .from('user_feedback')
      .insert({
        user_id: userId,
        category,
        message: message.trim(),
        email: userEmail,
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

    // Send email notification
    const categoryLabels: Record<string, string> = {
      bug: '🐛 Bug Report',
      feature: '✨ Feature Request',
      improvement: '💡 Improvement',
      other: '📝 Other',
    };

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed; margin-bottom: 24px;">New Feedback Received</h2>
        
        <div style="background: #f8f8fc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; color: #666;"><strong>Category:</strong> ${categoryLabels[category] || category}</p>
          <p style="margin: 0 0 8px 0; color: #666;"><strong>From:</strong> ${userName}</p>
          ${userEmail ? `<p style="margin: 0 0 8px 0; color: #666;"><strong>Email:</strong> ${userEmail}</p>` : ''}
          <p style="margin: 0; color: #666;"><strong>User ID:</strong> ${userId}</p>
        </div>
        
        <div style="background: #fff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 20px;">
          <h3 style="margin: 0 0 12px 0; color: #333;">Message:</h3>
          <p style="margin: 0; color: #333; white-space: pre-wrap; line-height: 1.6;">${message.trim()}</p>
        </div>
        
        <p style="margin-top: 24px; color: #999; font-size: 12px;">
          Feedback ID: ${data?.id || 'N/A'}<br>
          Submitted at: ${new Date().toISOString()}
        </p>
      </div>
    `;

    // Send email (don't block response on email failure)
    sendEmail({
      to: FEEDBACK_EMAIL,
      subject: `[Flowstarter Feedback] ${categoryLabels[category] || category} from ${userName}`,
      html: emailHtml,
      replyTo: userEmail || undefined,
    }).catch((emailError) => {
      console.error('Failed to send feedback notification email:', emailError);
    });

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
