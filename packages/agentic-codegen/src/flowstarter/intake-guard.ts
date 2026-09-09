import type {
  BusinessIntakePayload,
  SocialMediaTarget,
  SocialPlatform,
} from './types';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_PROVIDER = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
const INSTRUCTION_INJECTION =
  /\b(ignore|disregard|forget|override)\b[^.\n]{0,60}\b(previous|prior|above|earlier|system|developer)\b[^.\n]{0,30}\b(instruction|prompt|rule|message|context)s?\b/i;
const SYSTEM_PROBING =
  /\b(system prompt|reveal (?:the |your )?(?:prompt|instructions)|developer mode|jailbreak|you are now|act as (?:a |an )?system)\b/i;

const SOCIAL_HOSTS: Record<SocialPlatform, readonly string[]> = {
  instagram: ['instagram.com'],
  linkedin: ['linkedin.com'],
};

export class UnsafeBusinessIntakeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeBusinessIntakeError';
  }
}

export function containsAgentControlInstructions(text: string): boolean {
  return INSTRUCTION_INJECTION.test(text) || SYSTEM_PROBING.test(text);
}

/**
 * Deterministic first-line validation for public intake data. This does not
 * replace prompt isolation; it keeps malformed links and blatant role-control
 * payloads away from scrapers and agent sessions in the first place.
 */
export function assertSafeBusinessIntake(intake: BusinessIntakePayload): void {
  if (!UUID.test(intake.projectId))
    throw new UnsafeBusinessIntakeError('Invalid project identifier');
  if (
    intake.socialMedia.length > 0 &&
    (!intake.consent.publicProfileAnalysis || !intake.consent.acceptedAt)
  ) {
    throw new UnsafeBusinessIntakeError(
      'Public profile analysis requires explicit consent',
    );
  }

  assertTextField('business.name', intake.business.name, 200, true);
  assertTextField('business.niche', intake.business.niche, 240, true);
  assertTextField('business.location', intake.business.location, 240, true);
  assertTextField('business.description', intake.business.description, 5_000);
  assertTextField(
    'business.targetAudience',
    intake.business.targetAudience,
    1_000,
  );
  assertTextField('business.primaryGoal', intake.business.primaryGoal, 500);
  assertTextField('locale', intake.locale, 35, true);

  if (intake.socialMedia.length > 4) {
    throw new UnsafeBusinessIntakeError('Too many social profiles');
  }
  for (const target of intake.socialMedia) assertSocialTarget(target);

  if (intake.business.existingWebsiteUrl) {
    assertPublicHttpsUrl(
      intake.business.existingWebsiteUrl,
      'existing website',
    );
  }
}

function assertTextField(
  label: string,
  value: string | undefined,
  maxLength: number,
  required = false,
): void {
  const text = value?.trim() ?? '';
  if (required && !text)
    throw new UnsafeBusinessIntakeError(`${label} is required`);
  if (text.length > maxLength)
    throw new UnsafeBusinessIntakeError(`${label} is too long`);
  if (containsAgentControlInstructions(text)) {
    throw new UnsafeBusinessIntakeError(
      `${label} contains agent-control instructions`,
    );
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) {
    throw new UnsafeBusinessIntakeError(`${label} contains control characters`);
  }
}

function assertSocialTarget(target: SocialMediaTarget): void {
  assertTextField('social handle', target.handle, 100);
  if (!SAFE_PROVIDER.test(target.scraper.provider)) {
    throw new UnsafeBusinessIntakeError('Invalid scraper provider identifier');
  }
  const url = assertPublicHttpsUrl(target.profileUrl, target.platform);
  const allowedHosts = SOCIAL_HOSTS[target.platform];
  const hostname = url.hostname.toLowerCase();
  if (
    !allowedHosts.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    )
  ) {
    throw new UnsafeBusinessIntakeError(
      `Profile URL does not match ${target.platform}`,
    );
  }
}

function assertPublicHttpsUrl(value: string, label: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new UnsafeBusinessIntakeError(`Invalid ${label} URL`);
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) {
    throw new UnsafeBusinessIntakeError(
      `${label} URL must be public HTTPS without credentials or ports`,
    );
  }
  const hostname = url.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    /^(?:10|127)\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(?:1[6-9]|2\d|3[01])\./.test(hostname)
  ) {
    throw new UnsafeBusinessIntakeError(
      `${label} URL cannot target a private host`,
    );
  }
  return url;
}
