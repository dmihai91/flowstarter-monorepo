import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Use service role for public waitlist signups (no auth required)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WaitlistSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100).optional(),
  plan: z.enum(['free', 'starter', 'pro', 'business']),
  source: z.string().optional().default('pricing_page'),
  referralCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const parsed = WaitlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, name, plan, source, referralCode } = parsed.data;

    // Check if email already exists
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id, plan, created_at')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      // Update the plan if they're signing up for a different one
      if (existing.plan !== plan) {
        await supabase
          .from('waitlist')
          .update({
            plan,
            metadata: { updated_plan_at: new Date().toISOString() },
          })
          .eq('id', existing.id);
      }

      return NextResponse.json({
        success: true,
        message: 'already_registered',
        data: { plan: existing.plan, created_at: existing.created_at },
      });
    }

    // Insert new waitlist entry
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        email: email.toLowerCase(),
        name: name || null,
        plan,
        source,
        referral_code: referralCode || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Waitlist submission error:', error);
      return NextResponse.json(
        { error: 'Failed to join waitlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'registered',
      data: { id: data.id, plan: data.plan },
    });
  } catch (error) {
    console.error('Waitlist submission error:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('waitlist')
      .select('plan, created_at')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) {
      return NextResponse.json({ registered: false });
    }

    return NextResponse.json({
      registered: true,
      plan: data.plan,
      created_at: data.created_at,
    });
  } catch (error) {
    console.error('Waitlist check error:', error);
    return NextResponse.json(
      { error: 'Failed to check waitlist status' },
      { status: 500 }
    );
  }
}
