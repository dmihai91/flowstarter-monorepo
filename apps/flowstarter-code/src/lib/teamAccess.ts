import { isTeamEmail } from '@flowstarter/platform-config';

const TEAM_ROLES = new Set(['admin', 'team', 'developer', 'support']);

function readStringRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function getStringValue(record: Record<string, unknown> | null, key: string): string | null {
  const value = record?.[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function getNestedStringValue(
  record: Record<string, unknown> | null,
  parentKey: string,
  childKey: string,
): string | null {
  return getStringValue(readStringRecord(record?.[parentKey]), childKey);
}

export function isInternalTeamEmail(email: string | null | undefined): boolean {
  return isTeamEmail(email);
}

export function hasInternalTeamAccess(sessionClaims: unknown): boolean {
  const claims = readStringRecord(sessionClaims);
  const publicMetadata = readStringRecord(claims?.public_metadata);
  const privateMetadata = readStringRecord(claims?.private_metadata);
  const unsafeMetadata = readStringRecord(claims?.unsafe_metadata);

  const role =
    getStringValue(claims, 'role') ||
    getStringValue(claims, 'org_role') ||
    getStringValue(publicMetadata, 'role') ||
    getStringValue(privateMetadata, 'role') ||
    getStringValue(unsafeMetadata, 'role');

  if (role && TEAM_ROLES.has(role.toLowerCase())) {
    return true;
  }

  const email =
    getStringValue(claims, 'email') ||
    getStringValue(claims, 'email_address') ||
    getStringValue(claims, 'primary_email_address') ||
    getNestedStringValue(claims, 'email_addresses', '0') ||
    getNestedStringValue(publicMetadata, 'contact', 'email');

  return isTeamEmail(email);
}
