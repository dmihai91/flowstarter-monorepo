import { createClerkClient, verifyToken } from '@clerk/backend';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY || '',
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY || ''
});

const secretKey = process.env.CLERK_SECRET_KEY || '';

export interface AuthContext {
  userId: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  user?: any;
}

/**
 * Verify a Clerk session token and return authentication context
 */
export async function verifyAuth(sessionToken: string | undefined): Promise<AuthContext> {
  // Allow bypass for local development/testing
  if (process.env.DISABLE_AUTH === 'true') {
    return {
      userId: 'dev-user',
      sessionId: 'dev-session',
      isAuthenticated: true,
      user: {
        id: 'dev-user',
        email: 'dev@local.test',
        firstName: 'Dev',
        lastName: 'User'
      }
    };
  }

  if (!sessionToken) {
    return {
      userId: null,
      sessionId: null,
      isAuthenticated: false
    };
  }

  try {
    // Verify the JWT token using standalone verifyToken function
    const verifiedToken = await verifyToken(sessionToken, { secretKey });

    if (!verifiedToken || !verifiedToken.sub) {
      return {
        userId: null,
        sessionId: null,
        isAuthenticated: false
      };
    }

    // Get user information
    const user = await clerkClient.users.getUser(verifiedToken.sub);

    return {
      userId: verifiedToken.sub,
      sessionId: verifiedToken.sid || null,
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      userId: null,
      sessionId: null,
      isAuthenticated: false
    };
  }
}

/**
 * Check if authentication is required based on environment
 */
export function isAuthRequired(): boolean {
  return process.env.DISABLE_AUTH !== 'true';
}

/**
 * Check if Clerk is properly configured
 */
export function isClerkConfigured(): boolean {
  // Allow bypass for local development
  if (process.env.DISABLE_AUTH === 'true') {
    return true;
  }
  return process.env.CLERK_SECRET_KEY !== undefined && 
         process.env.CLERK_SECRET_KEY !== '';
}

/**
 * Check if user has permission to access templates
 * Can be extended to check for specific roles or permissions
 */
export async function checkUserPermissions(userId: string): Promise<{ hasPermission: boolean; error?: string }> {
  if (!userId) {
    return { hasPermission: false, error: 'User ID is required' };
  }

  try {
    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId);
    
    // Check if user is active
    if (!user) {
      return { hasPermission: false, error: 'User not found' };
    }

    // Check user metadata for permissions (if configured)
    // You can add custom permission checks here:
    // - Check publicMetadata.canAccessTemplates
    // - Check organization membership
    // - Check specific roles
    
    const metadata = user.publicMetadata as any;
    if (metadata?.banned === true) {
      return { hasPermission: false, error: 'User account is suspended' };
    }

    // By default, authenticated users have access
    // Extend this logic based on your permission requirements
    return { hasPermission: true };
  } catch (error) {
    console.error('Permission check error:', error);
    return { hasPermission: false, error: 'Failed to verify user permissions' };
  }
}

/**
 * Get Clerk client for additional operations
 */
export function getClerkClient() {
  return clerkClient;
}
