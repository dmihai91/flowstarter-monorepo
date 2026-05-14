/**
 * Validate Team Invitation Token
 *
 * Verifies the token and returns the invite details.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateInviteToken } from '@/lib/invite-tokens';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Validate the token
    const result = await validateInviteToken(token);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
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
        {
          valid: false,
          error:
            'An account with this email already exists. Please sign in instead.',
        },
        { status: 400 }
      );
    }

    // Get inviter name
    let inviterName = 'Your team';
    try {
      const inviter = await client.users.getUser(payload.invitedBy);
      inviterName = inviter.firstName
        ? `${inviter.firstName} ${inviter.lastName || ''}`.trim()
        : inviter.primaryEmailAddress?.emailAddress || 'Your team';
    } catch (e) {
      // Inviter might have been deleted
    }

    return NextResponse.json({
      valid: true,
      email: payload.email,
      role: payload.role,
      inviterName,
    });
  } catch (error) {
    console.error('[Join Validate] Error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate invitation' },
      { status: 500 }
    );
  }
}
