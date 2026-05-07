/**
 * POST /api/contact
 * Handles contact form submissions. No auth required.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

const ContactSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name is required')
    .max(100),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address'),
  subject: z
    .string({ required_error: 'Subject is required' })
    .min(1, 'Subject is required')
    .max(200),
  message: z
    .string({ required_error: 'Message is required' })
    .min(1, 'Message is required')
    .max(5000),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = ContactSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.errors[0].message },
      { status: 400 }
    );
  }

  const { name, email, subject, message } = result.data;

  try {
    const supabase = createSupabaseServiceRoleClient();

    const { error } = await supabase.from('contact_submissions').insert({
      name,
      email,
      subject,
      message,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[Contact] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save your message. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('[Contact] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
