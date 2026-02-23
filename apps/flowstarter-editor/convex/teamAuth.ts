/**
 * Team Authentication Functions
 * 
 * Simple email-based auth for team members (Darius, Dorin).
 * For MVP, we use a simple password hash comparison.
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';

// Generate a random session token
function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Simple hash function (for MVP - use bcrypt in production)
function simpleHash(password: string): string {
  // In production, use bcrypt or argon2
  // This is a placeholder that just base64 encodes
  return Buffer.from(password).toString('base64');
}

function verifyPassword(password: string, hash: string): boolean {
  return simpleHash(password) === hash;
}

// ═══════════════════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize team members (run once on setup)
 */
export const initTeamMembers = mutation({
  args: {
    members: v.array(v.object({
      email: v.string(),
      name: v.string(),
      password: v.string(),
      role: v.union(v.literal('admin'), v.literal('editor')),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    for (const member of args.members) {
      // Check if member already exists
      const existing = await ctx.db
        .query('teamMembers')
        .withIndex('by_email', (q) => q.eq('email', member.email))
        .first();
      
      if (!existing) {
        await ctx.db.insert('teamMembers', {
          email: member.email,
          name: member.name,
          passwordHash: simpleHash(member.password),
          role: member.role,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    
    return { success: true };
  },
});

/**
 * Login with email and password
 */
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query('teamMembers')
      .withIndex('by_email', (q) => q.eq('email', args.email.toLowerCase()))
      .first();
    
    if (!member || !member.passwordHash) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    if (!verifyPassword(args.password, member.passwordHash)) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    // Create session
    const now = Date.now();
    const token = generateSessionToken();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days
    
    await ctx.db.insert('sessions', {
      token,
      userType: 'team',
      teamMemberId: member._id,
      expiresAt,
      lastActiveAt: now,
      createdAt: now,
    });
    
    // Update last login
    await ctx.db.patch(member._id, {
      lastLoginAt: now,
      updatedAt: now,
    });
    
    return {
      success: true,
      token,
      user: {
        id: member._id,
        email: member.email,
        name: member.name,
        role: member.role,
      },
    };
  },
});

/**
 * Logout - invalidate session
 */
export const logout = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();
    
    if (session) {
      await ctx.db.delete(session._id);
    }
    
    return { success: true };
  },
});

/**
 * Validate session and get user
 */
export const validateSession = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.token) {
      return { valid: false };
    }
    
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();
    
    if (!session) {
      return { valid: false };
    }
    
    // Check expiry
    if (session.expiresAt < Date.now()) {
      return { valid: false, expired: true };
    }
    
    // Get user based on session type
    if (session.userType === 'team' && session.teamMemberId) {
      const member = await ctx.db.get(session.teamMemberId);
      if (!member) {
        return { valid: false };
      }
      
      return {
        valid: true,
        userType: 'team',
        user: {
          id: member._id,
          email: member.email,
          name: member.name,
          role: member.role,
        },
      };
    }
    
    if (session.userType === 'client' && session.clientId) {
      const client = await ctx.db.get(session.clientId);
      if (!client) {
        return { valid: false };
      }
      
      return {
        valid: true,
        userType: 'client',
        user: {
          id: client._id,
          email: client.email,
          name: client.name,
        },
        projectId: session.projectId,
      };
    }
    
    return { valid: false };
  },
});

/**
 * Get current team member (for internal routes)
 */
export const getCurrentTeamMember = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();
    
    if (!result || result.userType !== 'team' || !result.teamMemberId) {
      return null;
    }
    
    if (result.expiresAt < Date.now()) {
      return null;
    }
    
    const member = await ctx.db.get(result.teamMemberId);
    if (!member) {
      return null;
    }
    
    return {
      id: member._id,
      email: member.email,
      name: member.name,
      role: member.role,
    };
  },
});
