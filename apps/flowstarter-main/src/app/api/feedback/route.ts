import { useServerSupabase } from '@/hooks/useServerSupabase';
import { sendEmail } from '@/lib/email';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const FEEDBACK_EMAIL = 'contact@flowstarter.app';
const LINEAR_API_URL = 'https://api.linear.app/graphql';

// Category to Linear label mapping (you'll need to set these label IDs from your Linear workspace)
const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  feature: 'Feature',
  improvement: 'Improvement',
  other: 'Feedback',
};

async function createLinearIssue(params: {
  title: string;
  description: string;
  category: string;
  userName: string;
  userEmail: string | null;
  feedbackId: string;
}) {
  const apiKey = process.env.LINEAR_API_KEY;
  const teamId = process.env.LINEAR_TEAM_ID;

  if (!apiKey || !teamId) {
    console.warn('[Linear] LINEAR_API_KEY or LINEAR_TEAM_ID not configured, skipping issue creation');
    return null;
  }

  const categoryEmoji: Record<string, string> = {
    bug: '🐛',
    feature: '✨',
    improvement: '💡',
    other: '📝',
  };

  const title = `${categoryEmoji[params.category] || '📝'} ${CATEGORY_LABELS[params.category] || 'Feedback'}: ${params.title}`;
  
  const description = `
## User Feedback

**From:** ${params.userName}
${params.userEmail ? `**Email:** ${params.userEmail}` : ''}
**Category:** ${CATEGORY_LABELS[params.category] || params.category}
**Feedback ID:** ${params.feedbackId}

---

${params.description}
  `.trim();

  const mutation = `
    mutation CreateIssue($title: String!, $description: String!, $teamId: String!) {
      issueCreate(input: {
        title: $title
        description: $description
        teamId: $teamId
      }) {
        success
        issue {
          id
          identifier
          url
        }
      }
    }
  `;

  try {
    const response = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          title,
          description,
          teamId,
        },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('[Linear] GraphQL errors:', data.errors);
      return null;
    }

    if (data.data?.issueCreate?.success) {
      console.info(`[Linear] Issue created: ${data.data.issueCreate.issue.identifier}`);
      return data.data.issueCreate.issue;
    }

    return null;
  } catch (error) {
    console.error('[Linear] Failed to create issue:', error);
    return null;
  }
}

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

    // Use service role client (bypasses RLS since we verified auth via Clerk)
    const supabase = useServerSupabase();

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

    // Send email (don't block response)
    sendEmail({
      to: FEEDBACK_EMAIL,
      subject: `[Flowstarter Feedback] ${categoryLabels[category] || category} from ${userName}`,
      html: emailHtml,
      replyTo: userEmail || undefined,
    }).catch((emailError) => {
      console.error('Failed to send feedback notification email:', emailError);
    });

    // Create Linear issue (don't block response)
    const messagePreview = message.trim().slice(0, 50) + (message.length > 50 ? '...' : '');
    createLinearIssue({
      title: messagePreview,
      description: message.trim(),
      category,
      userName,
      userEmail,
      feedbackId: data?.id || 'N/A',
    }).catch((linearError) => {
      console.error('Failed to create Linear issue:', linearError);
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
