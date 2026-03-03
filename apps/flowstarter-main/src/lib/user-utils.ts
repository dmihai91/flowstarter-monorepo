/**
 * Get user initials from Clerk user object or name parts.
 * Single source of truth - used by UserMenu, ProfileContent, etc.
 */
export function getInitials(user: {
  firstName?: string | null;
  lastName?: string | null;
  emailAddresses?: Array<{ emailAddress: string }>;
}): string {
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  if (user.emailAddresses?.[0]?.emailAddress) {
    return user.emailAddresses[0].emailAddress[0].toUpperCase();
  }
  return 'U';
}
