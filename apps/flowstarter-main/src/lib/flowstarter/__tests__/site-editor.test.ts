// @vitest-environment node
/**
 * What a client may point at, what happens when they change it, and what the
 * editor refuses.
 *
 * The cases that matter here are the refusals. A target list that is merely
 * incomplete costs a support message; a target list that offers an `href` or a
 * component's class attribute to a plain-English rewriting agent costs the
 * client a broken site, and no amount of UI care prevents it, because the UI
 * is not where the decision is made.
 */
import { describe, expect, it, vi } from 'vitest';
// Static imports: vi.mock is hoisted above them, and the app's tsconfig does
// not allow top-level await in tests.
import {
  applyTargetEdit,
  classifyTargetCapability,
  decideEditorAction,
  findTarget,
  listEditableTargets,
  parseSiteManifest,
  policyStatus,
  subscriptionAccessStatus,
  type SiteFile,
} from '../site-editor';
import {
  contentTypeForPath,
  isUnsafePreviewPath,
  renderContentPreview,
  resolveManifestFile,
} from '../site-preview';
import { diffWords } from '@/components/flowstarter/editor/editor-client';

vi.mock('server-only', () => ({}));
// The module reaches for the service-role client at call time, never at import
// time; these cases never call the persistence half.
vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => {
    throw new Error('no database in these cases');
  },
}));

const CONTENT = `---
siteMeta:
  title: "Halden & Roe"
  description: "An independent consultancy."

hero:
  label: "Operations consultancy"
  title: "Decisions that hold"
  text: |
    We are Halden and Roe.

    No deck-and-leave.
  image: "/images/hero.jpg"
  imageAlt: "A meeting room"
  actions:
    - label: "Book a session"
      href: "/book"
---
`;

function site(): SiteFile[] {
  return [
    { path: 'src/content/site-labels.md', content: CONTENT },
    {
      path: 'src/components/Hero.astro',
      content: '<section class="hero"><slot /></section>\n',
    },
    { path: 'src/styles/tokens.css', content: ':root { --ink: #101014; }\n' },
    { path: 'public/images/hero.jpg', content: 'AAAA', encoding: 'base64' },
  ];
}

describe('listEditableTargets', () => {
  it('offers the prose a client would want to change', () => {
    const targets = listEditableTargets(site());
    const byId = Object.fromEntries(
      targets.map((target) => [target.id, target])
    );

    expect(byId['src/content/site-labels.md#3']?.content).toBe('Halden & Roe');
    expect(byId['src/content/site-labels.md#3']?.section).toBe('siteMeta');
    expect(byId['src/content/site-labels.md#7']?.content).toBe(
      'Operations consultancy'
    );
    expect(byId['src/content/site-labels.md#7']?.key).toBe('label');
    expect(byId['src/content/site-labels.md#14']?.content).toBe(
      'A meeting room'
    );
    // A repeated key in a list is still its own block, addressed by its line.
    expect(byId['src/content/site-labels.md#16']?.content).toBe(
      'Book a session'
    );
  });

  it('never offers an address, a picture path or a stylesheet', () => {
    const keys = listEditableTargets(site()).map((target) => target.key);
    expect(keys).not.toContain('href');
    expect(keys).not.toContain('image');
    // A stylesheet has no scalars at all and must contribute nothing.
    expect(
      listEditableTargets([
        { path: 'src/styles/tokens.css', content: ':root { --ink: #101014; }' },
      ])
    ).toHaveLength(0);
  });

  it('reads a YAML block scalar as one block, paragraphs and all', () => {
    const block = findTarget(site(), 'src/content/site-labels.md#9');
    expect(block?.syntax).toBe('block');
    expect(block?.content).toBe(
      'We are Halden and Roe.\n\nNo deck-and-leave.'
    );
    expect(block?.lineCount).toBe(4);
  });

  it('honours the data-flowstarter-id a built site carries', () => {
    const targets = listEditableTargets([
      {
        path: 'src/pages/index.astro',
        content:
          '<h1 class="x" data-flowstarter-id="hero-heading">Decisions that hold</h1>\n',
      },
    ]);
    expect(targets).toHaveLength(1);
    expect(targets[0]?.id).toBe('hero-heading');
    expect(targets[0]?.content).toBe('Decisions that hold');
  });
});

describe('classifyTargetCapability', () => {
  it('calls an editable block content', () => {
    expect(
      classifyTargetCapability(site(), 'src/content/site-labels.md#7')
    ).toBe('content');
  });

  it('names a structural target as what it really is', () => {
    // The href line inside a content file: a content *file*, but not content.
    expect(
      classifyTargetCapability(site(), 'src/content/site-labels.md#17')
    ).toBe('layout');
    expect(classifyTargetCapability(site(), 'src/components/Hero.astro#1')).toBe(
      'layout'
    );
    expect(classifyTargetCapability(site(), 'src/styles/tokens.css#1')).toBe(
      'color'
    );
    expect(classifyTargetCapability(site(), 'src/lib/analytics.ts#4')).toBe(
      'code'
    );
  });

  it('refuses a structural target through the policy, not through the UI', () => {
    const access = {
      actorId: 'user_client',
      role: 'client' as const,
      subscriptionStatus: 'active' as const,
    };
    const capability = classifyTargetCapability(
      site(),
      'src/components/Hero.astro#1'
    );
    const decision = decideEditorAction(access, capability);
    expect(decision.action).toBe('maintenance_request');
    expect(decision.reason).toMatch(/require Flowstarter review/);
    expect(policyStatus(decision)).toBe(403);
  });

  it('denies everything once the subscription lapses', () => {
    const decision = decideEditorAction(
      {
        actorId: 'user_client',
        role: 'client',
        subscriptionStatus: subscriptionAccessStatus('past_due'),
      },
      'content'
    );
    expect(decision.action).toBe('deny');
    expect(decision.reason).toMatch(/active care subscription/);
    expect(policyStatus(decision)).toBe(402);
  });

  it('treats an unreadable subscription state as no subscription', () => {
    expect(subscriptionAccessStatus(null)).toBe('none');
    expect(subscriptionAccessStatus('something_new')).toBe('none');
    expect(subscriptionAccessStatus('trialing')).toBe('trialing');
  });
});

describe('applyTargetEdit', () => {
  it('rewrites one quoted scalar and leaves the rest of the file alone', () => {
    const before = site();
    const applied = applyTargetEdit({
      files: before,
      targetId: 'src/content/site-labels.md#7',
      originalContent: 'Operations consultancy',
      replacementContent: 'Operations and strategy consultancy',
    });
    const content = applied.files.find(
      (file) => file.path === 'src/content/site-labels.md'
    )?.content;
    expect(content).toContain('  label: "Operations and strategy consultancy"');
    expect(content).toContain('  href: "/book"');
    expect(applied.changedPaths).toEqual(['src/content/site-labels.md']);
    // The input file set is not mutated.
    expect(before[0]?.content).toBe(CONTENT);
  });

  it('escapes a quote rather than breaking the YAML', () => {
    const applied = applyTargetEdit({
      files: site(),
      targetId: 'src/content/site-labels.md#7',
      originalContent: 'Operations consultancy',
      replacementContent: 'The "quiet" consultancy',
    });
    const content = applied.files[0]?.content ?? '';
    expect(content).toContain('label: "The \\"quiet\\" consultancy"');
    // And it round-trips: the target reads back as what was written.
    expect(findTarget(applied.files, 'src/content/site-labels.md#7')?.content).toBe(
      'The "quiet" consultancy'
    );
  });

  it('rewrites a block scalar across its lines', () => {
    const applied = applyTargetEdit({
      files: site(),
      targetId: 'src/content/site-labels.md#9',
      originalContent: 'We are Halden and Roe.\n\nNo deck-and-leave.',
      replacementContent: 'We are Halden and Roe.\n\nWe stay until it works.',
    });
    expect(findTarget(applied.files, 'src/content/site-labels.md#9')?.content).toBe(
      'We are Halden and Roe.\n\nWe stay until it works.'
    );
    // The key after the block is still where it was.
    expect(applied.files[0]?.content).toContain('  image: "/images/hero.jpg"');
  });

  it('refuses when the block moved on under it', () => {
    expect(() =>
      applyTargetEdit({
        files: site(),
        targetId: 'src/content/site-labels.md#7',
        originalContent: 'Something somebody else already replaced',
        replacementContent: 'Operations and strategy consultancy',
      })
    ).toThrowError(/changed since you started/);
  });

  it('refuses markup, however it arrives', () => {
    expect(() =>
      applyTargetEdit({
        files: site(),
        targetId: 'src/content/site-labels.md#7',
        originalContent: 'Operations consultancy',
        replacementContent: '<script>alert(1)</script>',
      })
    ).toThrowError(/plain text/);
  });

  it('refuses a target that is not editable at all', () => {
    expect(() =>
      applyTargetEdit({
        files: site(),
        targetId: 'src/components/Hero.astro#1',
        originalContent: '<section class="hero">',
        replacementContent: 'a nicer hero',
      })
    ).toThrowError(/no longer part of this site/);
  });
});

describe('parseSiteManifest', () => {
  it('refuses a manifest that lost its shape', () => {
    expect(() => parseSiteManifest({})).toThrowError(/no stored file manifest/);
    expect(() => parseSiteManifest({ files: [{ path: 'a' }] })).toThrowError(
      /no content/
    );
  });
});

describe('serving a site out of its manifest', () => {
  it('refuses to walk out of the manifest', () => {
    expect(isUnsafePreviewPath(['..', '..', '.env'])).toBe(true);
    expect(isUnsafePreviewPath(['images', '..', '..', 'secrets'])).toBe(true);
    expect(isUnsafePreviewPath(['a\\b'])).toBe(true);
    expect(isUnsafePreviewPath(['images', 'hero.jpg'])).toBe(false);

    expect(resolveManifestFile(site(), ['..', 'src', 'styles', 'tokens.css'])).toBeNull();
    expect(resolveManifestFile(site(), ['nope.png'])).toBeNull();
  });

  it('finds a public asset by its site-rooted path', () => {
    const file = resolveManifestFile(site(), ['images', 'hero.jpg']);
    expect(file?.path).toBe('public/images/hero.jpg');
    expect(contentTypeForPath(file?.path ?? '')).toBe('image/jpeg');
  });

  it('labels each kind of file it will hand back', () => {
    expect(contentTypeForPath('dist/index.html')).toBe('text/html; charset=utf-8');
    expect(contentTypeForPath('a/site.css')).toBe('text/css; charset=utf-8');
    expect(contentTypeForPath('a/app.js')).toBe('text/javascript; charset=utf-8');
    expect(contentTypeForPath('a/logo.svg')).toBe('image/svg+xml');
    expect(contentTypeForPath('a/thing.unknown')).toBe('application/octet-stream');
  });
});

describe('renderContentPreview', () => {
  it('stamps every editable block with the id the edit routes accept', () => {
    const files = site();
    const html = renderContentPreview({
      files,
      targets: listEditableTargets(files),
      siteName: 'Halden & Roe',
      templateSlug: 'professional-services',
      version: 3,
    });
    expect(html).toContain('data-flowstarter-id="src/content/site-labels.md#7"');
    expect(html).toContain('Operations consultancy');
    // Its own name is escaped like everything else.
    expect(html).toContain('Halden &amp; Roe');
    expect(html).not.toContain('<script>alert');
  });

  it('escapes content rather than rendering it', () => {
    const files: SiteFile[] = [
      {
        path: 'src/content/site-labels.md',
        content: 'hero:\n  title: "Bread & butter"\n',
      },
    ];
    const html = renderContentPreview({
      files,
      targets: listEditableTargets(files),
      siteName: 'Bakery',
      templateSlug: null,
      version: 1,
    });
    expect(html).toContain('Bread &amp; butter');
  });
});

describe('diffWords', () => {
  it('shows only what changed', () => {
    const parts = diffWords('We open on weekdays', 'We open on Saturdays too');
    expect(parts.filter((part) => part.kind === 'removed')).toHaveLength(1);
    expect(parts.filter((part) => part.kind === 'added')).toHaveLength(1);
    expect(parts[0]?.text).toBe('We open on ');
  });
});
