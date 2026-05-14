/**
 * libraryTemplates — facade over the @flowstarter/mcp-server template
 * library. The empty-state gallery and any future "open template
 * picker" surfaces consume `loadLibraryTemplates()` so the data source
 * can swap from static mock → editor server `/api/library/templates`
 * (which proxies the MCP `list_templates` tool) without rewriting the
 * UI.
 *
 * Phase 1 (this turn): static mock seeded from
 * `apps/flowstarter-library/templates/{slug}/config.json`.
 * Phase 2: replace `loadLibraryTemplates()` body with a real fetch.
 */

export type LibraryTemplateCategory =
  | "coaching"
  | "fitness"
  | "creative"
  | "mental-health"
  | "business"
  | "other";

export interface LibraryTemplate {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly category: LibraryTemplateCategory;
  readonly tags: ReadonlyArray<string>;
  /** Featured ordering — lower = more prominent. */
  readonly weight?: number;
  /** Where to fetch thumbnails. Resolved at render time. */
  readonly thumbnailPaths: {
    readonly light: string;
    readonly dark: string;
  };
}

const MOCK_TEMPLATES: ReadonlyArray<LibraryTemplate> = [
  {
    slug: "coach-pro",
    name: "Coach Pro",
    description:
      "Transformation-focused template for life coaches, business coaches, and executive coaches. Includes booking calendar, coaching packages, and client success stories.",
    category: "coaching",
    tags: ["life-coach", "business-coach", "executive-coach", "transformation"],
    weight: 10,
    thumbnailPaths: {
      light: "/library-thumbs/coach-pro-light.png",
      dark: "/library-thumbs/coach-pro-dark.png",
    },
  },
  {
    slug: "creative-portfolio",
    name: "Creative Portfolio",
    description:
      "Bold monochrome template with amber accents — built for photographers, designers, and videographers. Project inquiry form + creative process showcase.",
    category: "creative",
    tags: ["photographer", "designer", "videographer", "portfolio"],
    weight: 20,
    thumbnailPaths: {
      light: "/library-thumbs/creative-portfolio-light.png",
      dark: "/library-thumbs/creative-portfolio-dark.png",
    },
  },
  {
    slug: "fitness-coach",
    name: "Fitness Trainer Pro",
    description:
      "High-energy template for personal trainers and fitness coaches. Transformation gallery, training programs, booking system, client results.",
    category: "fitness",
    tags: ["personal-trainer", "fitness", "yoga", "strength"],
    weight: 30,
    thumbnailPaths: {
      light: "/library-thumbs/fitness-coach-light.png",
      dark: "/library-thumbs/fitness-coach-dark.png",
    },
  },
  {
    slug: "freelancer-portfolio",
    name: "Freelancer Portfolio",
    description:
      "Premium dark/light editorial template for freelance designers, developers, and creatives. Case-study showcase, services, booking.",
    category: "creative",
    tags: ["freelancer", "portfolio", "ux", "designer"],
    weight: 40,
    thumbnailPaths: {
      light: "/library-thumbs/freelancer-portfolio-light.png",
      dark: "/library-thumbs/freelancer-portfolio-dark.png",
    },
  },
  {
    slug: "therapist-care",
    name: "Therapist Care",
    description:
      "Calming, professional template for therapists and counselors. Warm sage-green palette, HIPAA-compliant design, appointment booking.",
    category: "mental-health",
    tags: ["therapist", "counselor", "psychologist", "mental-health"],
    weight: 50,
    thumbnailPaths: {
      light: "/library-thumbs/therapist-care-light.png",
      dark: "/library-thumbs/therapist-care-dark.png",
    },
  },
];

/**
 * Load the available templates. Returns the static mock today.
 *
 * Phase 2 (real wiring):
 *   const res = await fetch("/api/library/templates", { credentials: "include" });
 *   if (!res.ok) throw new Error(`Library MCP returned ${res.status}`);
 *   return (await res.json()) as LibraryTemplate[];
 */
export async function loadLibraryTemplates(): Promise<ReadonlyArray<LibraryTemplate>> {
  return [...MOCK_TEMPLATES].sort(
    (a, b) => (a.weight ?? Number.POSITIVE_INFINITY) - (b.weight ?? Number.POSITIVE_INFINITY),
  );
}

export const CATEGORY_LABELS: Record<LibraryTemplateCategory, string> = {
  coaching: "Coaching",
  fitness: "Fitness",
  creative: "Creative",
  "mental-health": "Mental health",
  business: "Business",
  other: "Other",
};
