/**
 * Create Team Member Account
 * 
 * Creates a new Clerk user from a valid invitation token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateInviteToken } from '@/lib/invite-tokens';
import { clerkClient } from '@clerk/nextjs/server';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate the token
    const result = await validateInviteToken(token);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    const { payload } = result;

    // Check if user already exists
    const client = await clerkClient();
    const existingUsers = await client.users.getUserList({
      emailAddress: [payload.email],
    });

    if (existingUsers.data.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Create the Clerk user
    const newUser = await client.users.createUser({
      emailAddress: [payload.email],
      password,
      publicMetadata: {
        role: payload.role,
        invitedBy: payload.invitedBy,
      },
      skipPasswordChecks: false,
    });

    console.info(`[Team Join] Created user ${newUser.id} for ${payload.email} with role ${payload.role}`);

    // Send welcome email
    try {
      await sendWelcomeEmail(payload.email);
    } catch (emailError) {
      // Don't fail if email fails
      console.error('[Team Join] Failed to send welcome email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
    });

  } catch (error) {
    console.error('[Team Join] Error creating user:', error);
    
    // Handle specific Clerk errors
    if (error instanceof Error) {
      if (error.message.includes('password')) {
        return NextResponse.json(
          { error: 'Password does not meet requirements. Use at least 8 characters with a mix of letters and numbers.' },
          { status: 400 }
        );
      }
      if (error.message.includes('email')) {
        return NextResponse.json(
          { error: 'Invalid email address' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
