import { experimental__simple as clerkSimpleBase } from '@clerk/themes';

/**
 * Selector for Clerk’s built-in UserButton sign-out control. When you render a
 * custom `<UserButton.Action>` sign-out row (with `labelIcon` / `onClick`),
 * Clerk still emits this row — hide it with the shared stylesheet
 * `@flowstarter/flow-design-system/clerk-account` (editor SPA). Do **not** use
 * a broad `.cl-button__signOut` rule or User Profile modals can break.
 */
export const FLOWSTARTER_CLERK_BUILTIN_SIGN_OUT_ROW_SELECTOR =
  '.cl-userButtonPopoverActionButton__signOut' as const;

/** Alias for docs / call sites that prefer the shorter name. */
export const FLOWSTARTER_SIGN_OUT_SELECTOR = FLOWSTARTER_CLERK_BUILTIN_SIGN_OUT_ROW_SELECTOR;

export type FlowstarterClerkThemeContext = {
  isDark: boolean;
  /** Resolve design tokens (Clerk variables often reject raw `var()` strings). */
  resolveVar: (varName: string, fallback: string) => string;
};

export type BuildFlowstarterClerkUserButtonOptions = FlowstarterClerkThemeContext & {
  /**
   * Editor header: compact trigger/box classes for the 32px chrome row.
   * Omit on the main Next.js app (`ClerkThemeWrapper`).
   */
  editorChrome?: boolean;
  /** Editor SPA stacks (`Onest` / `Plus Jakarta Sans`) for Clerk typography. */
  applyEditorFontStacks?: boolean;
};

/** Clerk “simple” base; cast avoids `exactOptionalPropertyTypes` friction with Clerk types. */
export function getFlowstarterClerkBaseTheme() {
  return clerkSimpleBase as any;
}

/**
 * Clerk `appearance.layout` fragment: hides the orange development-instance banner
 * in `<UserButton />` and other prebuilt surfaces (official API — not an `elements` key).
 *
 * @see https://clerk.com/docs (Layout / `unsafe_disableDevelopmentModeWarnings`)
 */
export const flowstarterClerkAppearanceLayoutHideDevWarnings = {
  unsafe_disableDevelopmentModeWarnings: true,
} as const;

/** Shared `appearance.variables` for Flowstarter — matches historical `ClerkThemeWrapper` tokens. */
export function buildFlowstarterClerkVariables({
  isDark,
  resolveVar,
  applyEditorFontStacks = false,
}: FlowstarterClerkThemeContext & { applyEditorFontStacks?: boolean }) {
  const variables = {
    colorPrimary: resolveVar(
      '--fs-accent',
      isDark ? 'hsl(233,70%,74%)' : 'hsl(233,65%,50%)',
    ),
    colorBackground: resolveVar(
      '--fs-bg-elevated',
      isDark ? '#100e1c' : '#ffffff',
    ),
    colorInputBackground: resolveVar(
      '--fs-bg-raised',
      /* Editor omits `--fs-bg-raised`; align with `--fs-bg-paper` / neutral paper. */
      isDark ? '#0a0714' : '#ebe9e4',
    ),
    colorText: resolveVar('--fs-ink', isDark ? '#f4eee4' : '#120a22'),
    colorTextSecondary: resolveVar(
      '--fs-ink-dim',
      isDark ? 'rgba(244,238,228,0.58)' : 'rgba(18,10,34,0.62)',
    ),
    colorInputText: resolveVar('--fs-ink', isDark ? '#f4eee4' : '#120a22'),
    colorAlphaShade: resolveVar(
      '--fs-rule',
      isDark ? 'rgba(244,238,228,0.12)' : 'rgba(18,10,34,0.10)',
    ),
    colorSuccess: isDark ? 'hsl(142,69%,58%)' : 'hsl(142,71%,45%)',
    colorError: isDark ? 'hsl(0,84%,68%)' : 'hsl(0,84%,60%)',
    colorWarning: isDark ? 'hsl(38,92%,62%)' : 'hsl(38,92%,50%)',
    borderRadius: '12px',
  } as Record<string, string>;

  if (applyEditorFontStacks) {
    variables.fontFamily =
      '"Onest Variable", "Onest", "Plus Jakarta Sans", system-ui, sans-serif';
    variables.fontFamilyButtons =
      '"Onest Variable", "Onest", "Plus Jakarta Sans", system-ui, sans-serif';
    variables.fontSize = '14px';
  }

  return variables;
}

/**
 * `appearance.elements` keys for the Clerk user profile menu (popover card,
 * preview strip, action rows, avatar).
 *
 * **Popover positioning**: never set `filter`, `backdrop-filter`, or
 * `drop-shadow` on `userButtonPopoverRootBox` (or any full‑popover wrapper).
 * Those create a containing block and break Clerk’s fixed-position surface —
 * the menu can look like it never opens.
 *
 * **Glass**: `backdrop-filter` on `userButtonPopoverCard`, the preview strip,
 * `userButtonPopoverActions`, and `userButtonPopoverFooter` is safe — they are
 * inner surfaces, not the fixed-position root.
 *
 * **Editor (`editorChrome`)**: popover width capped with `maxWidth` (kept in
 * sync with `clerk-account.css`), centered top nib on the card via that stylesheet
 * only, and a bit more transparent / layered “lift” glass vs the default
 * marketing styling. Extra editor `boxShadow` adds ambient lift only (no
 * second inset top rim — `glassShadow` already sheens the top edge).
 *
 * **Development banner**: not an `elements` key — pass
 * `appearance.layout.unsafe_disableDevelopmentModeWarnings` (see
 * `flowstarterClerkAppearanceLayoutHideDevWarnings`); `buildFlowstarterClerkUserButtonAppearance`
 * includes it by default.
 */
export function buildFlowstarterClerkUserButtonElements({
  isDark,
  resolveVar,
  editorChrome = false,
}: FlowstarterClerkThemeContext & { editorChrome?: boolean }) {
  const ink = resolveVar('--fs-ink', isDark ? '#f4eee4' : '#120a22');
  const inkDim = resolveVar(
    '--fs-ink-dim',
    isDark ? 'rgba(244,238,228,0.58)' : 'rgba(18,10,34,0.62)',
  );
  const inkMono = resolveVar(
    '--fs-ink-mono',
    isDark ? 'rgba(244,238,228,0.5)' : 'rgba(18,10,34,0.5)',
  );
  const rule = resolveVar(
    '--fs-rule',
    isDark ? 'rgba(244,238,228,0.12)' : 'rgba(18,10,34,0.10)',
  );
  const glassBg = resolveVar(
    '--fs-glass-bg',
    isDark ? 'rgba(22, 28, 45, 0.64)' : 'rgba(255, 255, 255, 0.58)',
  );
  const glassEdge = resolveVar(
    '--fs-glass-edge',
    isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(18, 10, 34, 0.1)',
  );
  const glassShadow = resolveVar(
    '--fs-glass-shadow',
    isDark
      ? 'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.34), 0 20px 50px rgba(2, 6, 23, 0.38), 0 8px 24px rgba(56, 97, 182, 0.14)'
      : 'inset 0 1px 0 rgba(255, 255, 255, 0.85), inset 0 -1px 0 rgba(18, 10, 34, 0.04), 0 24px 60px rgba(78, 94, 218, 0.06), 0 8px 22px rgba(18, 10, 34, 0.05)',
  );

  /** Top sheen + inner rim — paints over `backgroundColor` for frosted depth (not flat slabs). */
  const cardGlassSheen = isDark
    ? 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 46%), linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 55%)'
    : 'linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.14) 48%, rgba(255,255,255,0) 100%), linear-gradient(135deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 58%)';

  const previewGlassSheen = isDark
    ? 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 52%)'
    : 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 100%)';

  const actionsTrayTint = isDark ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.26)';

  const userPopoverCardAmbient = isDark
    ? ', 0 28px 72px rgba(0,0,0,0.42), 0 8px 24px rgba(78,94,218,0.14)'
    : ', 0 22px 56px rgba(78,94,218,0.08), 0 6px 18px rgba(18,10,34,0.05)';

  const userPopoverCardShadow = `${glassShadow}${userPopoverCardAmbient}`;

  /** Editor header: readable menu width + companion rule in `clerk-account.css`. */
  const editorPopoverMaxW = 'min(280px, calc(100vw - 24px))';
  const editorGlassBg = isDark ? 'rgba(22, 28, 45, 0.52)' : 'rgba(255, 255, 255, 0.44)';
  const editorCardSheen = isDark
    ? 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 42%), linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 52%)'
    : 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.22) 45%, rgba(255,255,255,0) 100%), linear-gradient(135deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0) 55%)';
  const editorPopoverLiftShadow = isDark
    ? ', 0 12px 28px rgba(0,0,0,0.28)'
    : ', 0 10px 26px rgba(78, 94, 218, 0.07)';

  const accent = resolveVar(
    '--fs-accent',
    isDark ? 'hsl(233,70%,74%)' : 'hsl(233,65%,50%)',
  );

  const signOutFg = isDark ? 'hsl(0, 42%, 72%)' : 'hsl(0, 38%, 42%)';
  const signOutHoverBg = isDark
    ? 'rgba(248, 113, 113, 0.09)'
    : 'rgba(185, 28, 28, 0.06)';

  const rowHoverBg = isDark
    ? 'rgba(255,255,255,0.05)'
    : resolveVar('--fs-accent-bg', 'rgba(78, 94, 218, 0.06)');

  return {
    ...(editorChrome
      ? {
          rootBox: 'font-sans',
          userButtonBox:
            'relative z-30 flex h-[var(--fs-chrome-control-h)] shrink-0 items-center justify-center pointer-events-auto [-webkit-app-region:no-drag]',
          userButtonTrigger:
            'pointer-events-auto cursor-pointer [-webkit-app-region:no-drag] !m-0 !flex !h-full !max-h-[var(--fs-chrome-control-h)] !min-h-0 !items-center !justify-center !p-0',
        }
      : {}),

    dividerLine: {
      borderColor: rule,
    },

    userButtonPopoverRootBox: {
      zIndex: 9_999,
    },

    userButtonPopoverCard: {
      backgroundColor: editorChrome ? editorGlassBg : glassBg,
      backgroundImage: editorChrome ? editorCardSheen : cardGlassSheen,
      borderColor: glassEdge,
      borderStyle: 'solid',
      borderWidth: '1px',
      borderRadius: '12px',
      boxShadow: editorChrome
        ? `${userPopoverCardShadow}${editorPopoverLiftShadow}`
        : userPopoverCardShadow,
      overflow: 'hidden',
      backdropFilter: editorChrome
        ? 'blur(30px) saturate(182%) brightness(1.04)'
        : 'blur(26px) saturate(178%) brightness(1.03)',
      WebkitBackdropFilter: editorChrome
        ? 'blur(30px) saturate(182%) brightness(1.04)'
        : 'blur(26px) saturate(178%) brightness(1.03)',
      ...(editorChrome
        ? {
            maxWidth: editorPopoverMaxW,
          }
        : {}),
    },

    userButtonPopoverMain: {
      backgroundColor: 'transparent',
    },

    userPreview__userButton: {
      /* Frosted preview strip — same token stack as the card, extra local blur. */
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.22)',
      backgroundImage: previewGlassSheen,
      padding: editorChrome ? '10px 12px' : '12px 14px',
      borderBottom: `1px solid ${rule}`,
      /* No inset top line: card border + this inset read as a double rule. */
      boxShadow: 'none',
      backdropFilter: 'blur(18px) saturate(168%) brightness(1.02)',
      WebkitBackdropFilter: 'blur(18px) saturate(168%) brightness(1.02)',
    },

    userPreviewMainIdentifierText__userButton: {
      color: ink,
      fontWeight: 500,
      fontSize: '14px',
      letterSpacing: '-0.005em',
    },

    userPreviewSecondaryIdentifier__userButton: {
      color: inkDim,
      fontSize: '12px',
      fontWeight: 400,
      letterSpacing: 'normal',
      textTransform: 'none',
    },

    userButtonPopoverActions: {
      padding: '6px',
      gap: '2px',
      backgroundColor: actionsTrayTint,
      backdropFilter: 'blur(14px) saturate(158%)',
      WebkitBackdropFilter: 'blur(14px) saturate(158%)',
    },

    userButtonPopoverActionButton: {
      borderRadius: '8px',
      fontWeight: 500,
      fontSize: '14px',
      letterSpacing: '-0.005em',
      transition: 'background 140ms ease, color 140ms ease',
      '&:hover': {
        backgroundColor: rowHoverBg,
      },
    },

    userButtonPopoverActionButton__manageAccount: {
      color: inkDim,
      borderRadius: '8px',
      fontWeight: 500,
      fontSize: '14px',
      transition: 'background 140ms ease, color 140ms ease',
      '&:hover': {
        backgroundColor: rowHoverBg,
        color: ink,
      },
    },

    userButtonPopoverActionButtonIcon__manageAccount: {
      color: inkMono,
    },

    userButtonPopoverActionButton__signOut: {
      color: signOutFg,
      borderRadius: '8px',
      fontWeight: 500,
      fontSize: '14px',
      transition: 'background 140ms ease, color 140ms ease',
      '&:hover': {
        backgroundColor: signOutHoverBg,
        color: isDark ? 'hsl(0, 48%, 82%)' : 'hsl(0, 42%, 36%)',
      },
    },

    userButtonPopoverActionButtonIconBox__signOut: {
      color: signOutFg,
      opacity: 0.85,
    },

    userButtonPopoverCustomItemButton: {
      color: signOutFg,
      borderRadius: '8px',
      fontWeight: 500,
      fontSize: '14px',
      transition: 'background 140ms ease, color 140ms ease',
      '&:hover': {
        backgroundColor: signOutHoverBg,
        color: isDark ? 'hsl(0, 48%, 82%)' : 'hsl(0, 42%, 36%)',
      },
    },

    userButtonPopoverCustomItemButtonIconBox: {
      color: signOutFg,
      opacity: 0.85,
    },

    userButtonAvatarBox: {
      borderRadius: editorChrome ? '7px' : '12px',
      width: editorChrome ? '28px' : '36px',
      height: editorChrome ? '28px' : '36px',
      boxShadow: isDark
        ? '0 0 0 1px rgba(255,255,255,0.12), 0 1px 0 rgba(255,255,255,0.06) inset'
        : '0 0 0 1px rgba(18,10,34,0.08), 0 1px 0 rgba(255,255,255,0.5) inset',
    },

    userButtonAvatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },

    /* Secured-by / links strip — same glass language as the card (dev banner off via layout). */
    userButtonPopoverFooter: {
      display: 'block',
      margin: '0',
      padding: editorChrome ? '8px 10px' : '8px 12px',
      fontSize: '11px',
      lineHeight: '1.4',
      fontWeight: 500,
      letterSpacing: '0.01em',
      textTransform: 'none',
      color: inkDim,
      backgroundColor: isDark ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.2)',
      backgroundImage: isDark
        ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 50%)'
        : 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.06) 100%)',
      borderTop: `1px solid ${rule}`,
      boxShadow: isDark
        ? 'inset 0 1px 0 rgba(255,255,255,0.06)'
        : 'inset 0 1px 0 rgba(255,255,255,0.48)',
      backdropFilter: 'blur(20px) saturate(170%) brightness(1.02)',
      WebkitBackdropFilter: 'blur(20px) saturate(170%) brightness(1.02)',
    },

    footerActionLink: {
      color: accent,
      textDecoration: 'none',
      '&:hover': { textDecoration: 'underline' },
    },

    modalBackdrop: 'backdrop-blur-sm bg-black/30',
  };
}

/**
 * Full `appearance` object for `<UserButton />`, `<SignInButton />`, and
 * `userProfileProps` in the editor SPA.
 */
export function buildFlowstarterClerkUserButtonAppearance(
  options: BuildFlowstarterClerkUserButtonOptions,
) {
  const { isDark, resolveVar, editorChrome = false, applyEditorFontStacks = false } =
    options;

  return {
    baseTheme: getFlowstarterClerkBaseTheme(),
    layout: flowstarterClerkAppearanceLayoutHideDevWarnings,
    variables: buildFlowstarterClerkVariables({
      isDark,
      resolveVar,
      applyEditorFontStacks,
    }),
    elements: buildFlowstarterClerkUserButtonElements({
      isDark,
      resolveVar,
      editorChrome,
    }),
  };
}
