/**
 * The sufficiency gate: what is still missing before this project can be built
 * honestly.
 *
 * This module is deterministic on purpose. A model may *phrase* an ask, but it
 * must never decide whether an ask is needed — a gate that hallucinates is
 * worse than no gate, because it either nags a client who already sent
 * everything or green-lights a build that will invent a hero image. So: no
 * LLM, no network, no filesystem, no clock. Same input, same codes, forever.
 *
 * The image requirements are derived from the *chosen template's real slots*
 * (pass `listSiteImageSlots()` output as `slots`), but deliberately do not
 * demand all of them. A wellness-therapy template renders 17 images and a
 * professional-services one 21; a two-person business does not have 21
 * photographs and asking for them guarantees the client gives up. The gate
 * asks for the three the visitor actually sees above and just below the fold,
 * and lets the rest degrade into template artwork.
 *
 * Codes are stable identifiers because they key `MISSING_MESSAGES`, the
 * `asks` column on project_messages, and later calibration against outcomes.
 * Renaming one silently rewrites history — add a new code instead.
 */

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

/**
 * `blocking` means a build would have to invent something to proceed.
 * `degrades` means the build works but the site is visibly poorer for it.
 */
export type MissingSeverity = 'blocking' | 'degrades';

export const MISSING_CODES = [
  'hero_image_missing',
  'hero_image_low_resolution',
  'section_images_missing',
  'logo_missing',
  'business_text_thin',
  'contact_signal_missing',
  'services_missing',
] as const;

export type MissingCode = (typeof MISSING_CODES)[number];

export interface MissingItem {
  code: MissingCode;
  severity: MissingSeverity;
  /** The concrete ask, already resolved from `MISSING_MESSAGES`. */
  message: string;
  /** Which sections / slots suffer if this stays missing. */
  affects: string[];
}

export interface SufficiencyResult {
  /**
   * True when nothing `blocking` is outstanding. `degrades` items may still be
   * present: they are worth asking for, but they are not worth stopping for.
   */
  ready: boolean;
  missing: MissingItem[];
}

// ---------------------------------------------------------------------------
// Input shape
// ---------------------------------------------------------------------------

/**
 * The structural subset of `SiteImageSlot`
 * (`@flowstarter/agentic-codegen/src/flowstarter/site-media`) this gate needs.
 * Declared locally so the gate stays free of filesystem-touching imports and
 * can be unit tested with three object literals.
 */
export interface TemplateImageSlot {
  id: string;
  /** Top-level content group: `hero`, `caseStudies`, `aboutStory`, … */
  section: string;
  /** The key that held the path: `image`, `logo`, `authorImage`, … */
  key: string;
}

export interface SufficiencyImage {
  id: string;
  width?: number | null;
  height?: number | null;
  /**
   * Roles the ingest pipeline judged this asset fit for (the `usable_for`
   * column on `assets`). An explicit `hero` here beats the measured checks:
   * a human or an analyzer has already vouched for it.
   */
  usableFor?: readonly string[] | null;
  /** Template artwork or a generated stand-in never satisfies a requirement. */
  isPlaceholder?: boolean | null;
  /** `assets.kind`; `logo` images are excluded from photographic counts. */
  kind?: string | null;
}

export interface SufficiencyContact {
  phone?: string | null;
  email?: string | null;
  bookingUrl?: string | null;
}

export interface SufficiencyInput {
  /**
   * The chosen template's real image slots. Optional: with no slots the gate
   * falls back to the same default shape (one hero + two section images), so a
   * caller that has not picked a template yet still gets a usable answer.
   */
  slots?: readonly TemplateImageSlot[];
  /** Every non-logo image the project has, however it arrived. */
  images?: readonly SufficiencyImage[];
  /** The logo, if one has been supplied. */
  logo?: SufficiencyImage | null;
  /** Real prose about the business: intake answers, scraped about text, replies. */
  businessText?: string | readonly string[] | null;
  contact?: SufficiencyContact | null;
  services?: readonly string[] | null;
}

// ---------------------------------------------------------------------------
// Thresholds — every number the gate decides on, in one place
// ---------------------------------------------------------------------------

/**
 * A hero fills the full width of a desktop viewport. Below this it is visibly
 * soft on any modern display, which reads as "cheap site", not "cheap photo".
 */
export const HERO_MIN_WIDTH = 1600;

/**
 * Section images sit in a card or a half-width block, so they survive being
 * smaller than a hero.
 */
export const SECTION_IMAGE_MIN_WIDTH = 800;

/**
 * Enough prose to write a homepage from without inventing claims. Roughly
 * three sentences. Whitespace is collapsed before counting, so padding with
 * newlines does not pass the gate.
 */
export const MIN_BUSINESS_TEXT_CHARS = 200;

/** Fewer than three and the services section is a list with a hole in it. */
export const MIN_SERVICES = 3;

/**
 * How many non-hero images the gate will ask for, at most. The templates
 * render 17-21; this asks for two. See the module comment.
 */
export const MAX_REQUESTED_SECTION_IMAGES = 2;

/**
 * Sections ranked by how much of them a visitor sees before deciding to stay.
 * Anything not listed sorts last, in document order.
 */
export const SECTION_VISIBILITY_ORDER = [
  'hero',
  'caseStudies',
  'services',
  'aboutStory',
  'testimonials',
  'aboutPage',
  'blogPage',
] as const;

// ---------------------------------------------------------------------------
// Message templates
// ---------------------------------------------------------------------------

/**
 * One concrete, actionable ask per code. Never "send us some photos" — a
 * client who reads that sends four blurry phone shots of the car park. Each
 * line names the subject, the shape, and where it lands.
 */
export const MISSING_MESSAGES: Record<MissingCode, string> = {
  hero_image_missing:
    'One wide landscape photo for the top of your homepage: the outside of ' +
    'the premises, your team, or you at work. Landscape (wider than it is ' +
    'tall), at least 1600 pixels across. Straight off a recent phone is fine; ' +
    'a screenshot or a photo of a printout is not.',
  hero_image_low_resolution:
    'A larger version of your main photo. The one we have is too small or too ' +
    'tall to run across the top of the homepage: it needs to be landscape ' +
    'and at least 1600 pixels wide. The original file from the camera or ' +
    'phone, rather than one saved from WhatsApp or Facebook, is usually big ' +
    'enough.',
  section_images_missing:
    'Two more photos for the middle of the page: ideally finished work, the ' +
    'space itself, or your team. At least 800 pixels across each. Different ' +
    'subjects, not two angles of the same thing.',
  logo_missing:
    'Your logo as a PNG or SVG with a transparent background, at least 512 ' +
    'pixels wide. If the only copy you have is inside a PDF or a Word ' +
    'document, send that and we will pull it out.',
  business_text_thin:
    'A few sentences in your own words: what you do, who you do it for, and ' +
    'what makes someone choose you over the place down the road. Three or ' +
    'four sentences is plenty: we will not publish it verbatim, we need it ' +
    'so the site says true things.',
  contact_signal_missing:
    'One way for a customer to reach you that we can put on the site: a phone ' +
    'number, an email address, or the link to your booking system. Whichever ' +
    'one you actually answer.',
  services_missing:
    'A list of at least three things you sell or do, named the way you name ' +
    'them to customers. One line each, no descriptions needed.',
};

/** Which sections each requirement is holding up, when slots cannot say. */
const DEFAULT_AFFECTS: Record<MissingCode, string[]> = {
  hero_image_missing: ['hero'],
  hero_image_low_resolution: ['hero'],
  section_images_missing: ['caseStudies'],
  logo_missing: ['header', 'footer'],
  business_text_thin: ['hero', 'aboutStory'],
  contact_signal_missing: ['contact', 'footer'],
  services_missing: ['services'],
};

// ---------------------------------------------------------------------------
// Slot ranking
// ---------------------------------------------------------------------------

function visibilityRank(section: string): number {
  const index = SECTION_VISIBILITY_ORDER.indexOf(
    section as (typeof SECTION_VISIBILITY_ORDER)[number]
  );
  return index === -1 ? SECTION_VISIBILITY_ORDER.length : index;
}

/**
 * Orders a template's slots by how visible they are, keeping document order
 * inside a section. Exported because the client UI wants the same ordering
 * when it shows "these are the pictures we still need".
 */
export function rankSlotsByVisibility<T extends TemplateImageSlot>(
  slots: readonly T[]
): T[] {
  return slots
    .map((slot, index) => ({ slot, index }))
    .sort((a, b) => {
      const rank =
        visibilityRank(a.slot.section) - visibilityRank(b.slot.section);
      return rank !== 0 ? rank : a.index - b.index;
    })
    .map((entry) => entry.slot);
}

/**
 * The slots the gate will actually ask a client to fill: the hero, then the
 * first two of the next-most-visible section. Everything else keeps its
 * template artwork, which is a decision, not an oversight.
 */
export function requiredImageSlots<T extends TemplateImageSlot>(
  slots: readonly T[]
): { hero: T | null; sections: T[] } {
  const ranked = rankSlotsByVisibility(slots).filter(
    (slot) => slot.key !== 'logo'
  );
  const hero = ranked.find((slot) => slot.section === 'hero') ?? null;
  const sections = ranked
    .filter((slot) => slot !== hero)
    .slice(0, MAX_REQUESTED_SECTION_IMAGES);
  return { hero, sections };
}

// ---------------------------------------------------------------------------
// Eligibility
// ---------------------------------------------------------------------------

function isRealImage(image: SufficiencyImage): boolean {
  return !image.isPlaceholder && image.kind !== 'logo';
}

function vouchedFor(image: SufficiencyImage, role: string): boolean {
  return (image.usableFor ?? []).includes(role);
}

/**
 * Hero-eligible: a real photograph, wide enough, and not portrait. An explicit
 * `usable_for: ['hero']` from the ingest pipeline overrides the measurements,
 * because that flag is set by something that looked at the picture.
 */
export function isHeroEligible(image: SufficiencyImage): boolean {
  if (!isRealImage(image)) return false;
  if (vouchedFor(image, 'hero')) return true;
  if (typeof image.width !== 'number' || image.width < HERO_MIN_WIDTH) {
    return false;
  }
  if (typeof image.height === 'number' && image.height > image.width) {
    return false;
  }
  return true;
}

/** Section-eligible: a real photograph big enough for a card or half-width block. */
export function isSectionEligible(image: SufficiencyImage): boolean {
  if (!isRealImage(image)) return false;
  if (vouchedFor(image, 'hero') || vouchedFor(image, 'section')) return true;
  return (
    typeof image.width === 'number' && image.width >= SECTION_IMAGE_MIN_WIDTH
  );
}

// ---------------------------------------------------------------------------
// Text / contact / services
// ---------------------------------------------------------------------------

/** Collapsed length, so a wall of newlines does not count as prose. */
export function realTextLength(
  text: string | readonly string[] | null | undefined
): number {
  if (!text) return 0;
  const joined = Array.isArray(text) ? text.join(' ') : (text as string);
  return joined.replace(/\s+/g, ' ').trim().length;
}

function hasContactSignal(
  contact: SufficiencyContact | null | undefined
): boolean {
  if (!contact) return false;
  return [contact.phone, contact.email, contact.bookingUrl].some(
    (value) => typeof value === 'string' && value.trim().length > 0
  );
}

function namedServices(
  services: readonly string[] | null | undefined
): string[] {
  return (services ?? [])
    .map((service) => service.trim())
    .filter((service) => service.length > 0);
}

// ---------------------------------------------------------------------------
// The gate
// ---------------------------------------------------------------------------

function item(
  code: MissingCode,
  severity: MissingSeverity,
  affects: string[]
): MissingItem {
  return {
    code,
    severity,
    message: MISSING_MESSAGES[code],
    affects: affects.length > 0 ? affects : DEFAULT_AFFECTS[code],
  };
}

/**
 * Decides what is still missing. Pure: no I/O, no randomness, no model.
 *
 * Ordering is stable — declaration order below — so two runs over the same
 * project produce byte-identical `asks`, which is what lets `requestMissingAssets`
 * be idempotent and lets outcomes be compared across projects.
 */
export function evaluateSufficiency(
  input: SufficiencyInput
): SufficiencyResult {
  const slots = input.slots ?? [];
  const required = requiredImageSlots(slots);
  const images = (input.images ?? []).filter(isRealImage);
  const missing: MissingItem[] = [];

  // ── Hero ────────────────────────────────────────────────────────────────
  const heroAffects = required.hero ? [required.hero.section] : [];
  const heroCandidates = images.filter(isHeroEligible);
  if (heroCandidates.length === 0) {
    // Two situations, two codes: nothing usable at all, versus something that
    // is nearly right. The second gets a different ask ("send the original"),
    // and a client who is told the correct thing answers far more often.
    missing.push(
      images.length === 0
        ? item('hero_image_missing', 'blocking', heroAffects)
        : item('hero_image_low_resolution', 'blocking', heroAffects)
    );
  }

  // ── Section images ──────────────────────────────────────────────────────
  // One hero-eligible image is spoken for by the hero, so it cannot also
  // count towards the section quota.
  const requiredSections =
    slots.length > 0 ? required.sections.length : MAX_REQUESTED_SECTION_IMAGES;
  const heroReserved = heroCandidates.length > 0 ? 1 : 0;
  const sectionSupply = images.filter(isSectionEligible).length - heroReserved;
  if (requiredSections > 0 && sectionSupply < requiredSections) {
    missing.push(
      item(
        'section_images_missing',
        'degrades',
        required.sections.map((slot) => slot.section)
      )
    );
  }

  // ── Logo ────────────────────────────────────────────────────────────────
  if (!input.logo || input.logo.isPlaceholder) {
    missing.push(item('logo_missing', 'degrades', []));
  }

  // ── Words ───────────────────────────────────────────────────────────────
  if (realTextLength(input.businessText) < MIN_BUSINESS_TEXT_CHARS) {
    missing.push(item('business_text_thin', 'blocking', []));
  }

  // ── Contact ─────────────────────────────────────────────────────────────
  if (!hasContactSignal(input.contact)) {
    missing.push(item('contact_signal_missing', 'blocking', []));
  }

  // ── Services ────────────────────────────────────────────────────────────
  if (namedServices(input.services).length < MIN_SERVICES) {
    missing.push(item('services_missing', 'blocking', []));
  }

  return {
    ready: missing.every((entry) => entry.severity !== 'blocking'),
    missing,
  };
}
