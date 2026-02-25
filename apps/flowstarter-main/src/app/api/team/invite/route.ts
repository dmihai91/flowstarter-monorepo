/**
 * Team Invitation API
 * 
 * Creates Clerk invitations with team role for new team members.
 * Only accessible by admin users.
 */

import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the current user's auth
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata as { role?: string })?.role?.toLowerCase();
    
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can invite team members' },
        { status: 403 }
      );
    }

    // Get email from request body
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsers = await client.users.getUserList({
      emailAddress: [email],
    });

    if (existingUsers.data.length > 0) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Create invitation with team role
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { role: 'team' },
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://flowstarter.dev'}/team/login`,
    });

    console.info(`[Team Invite] Invitation sent to ${email} by ${user.primaryEmailAddress?.emailAddress}`);

    return NextResponse.json({
      success: true,
      invitationId: invitation.id,
      message: `Invitation sent to ${email}`,
    });

  } catch (error) {
    console.error('[Team Invite] Error creating invitation:', error);
    
    // Handle specific Clerk errors
    if (error instanceof Error) {
      if (error.message.includes('already been invited')) {
        return NextResponse.json(
          { error: 'This email has already been invited' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
