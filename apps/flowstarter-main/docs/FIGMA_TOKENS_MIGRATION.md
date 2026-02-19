# Figma Design Tokens Migration Guide

## Overview
This document describes the migration from hardcoded color values to Figma design tokens (CSS variables) in the Flowstarter codebase.

## Changes Made

### 1. Added Design Token CSS Variables
**File:** `src/styles/theme-colors.css`

New CSS variables have been added for consistent theming across light and dark modes:

#### Neutral Backgrounds
- `--ui-bg-base` - Base background color
- `--ui-bg-subtle` - Subtle background for elevated surfaces
- `--ui-bg-elevated` - Elevated surface background
- `--ui-bg-overlay` - Semi-transparent overlay (rgba(58, 58, 74, 0.3))
- `--ui-bg-overlay-hover` - Hover state for overlays (rgba(75, 75, 94, 0.3))
- `--ui-bg-input` - Input field backgrounds (rgba(51, 51, 61, 0.3))

#### UI Borders
- `--ui-border-base` - Standard border color (#575768)
- `--ui-border-strong` - Stronger border emphasis
- `--ui-border-focus` - Focus state border (#c1c8ff)

#### Text Colors
- `--ui-text-primary` - Primary text (#ffffff)
- `--ui-text-secondary` - Secondary text (#bfbfc8)
- `--ui-text-tertiary` - Tertiary text
- `--ui-text-dark` - Dark text for light backgrounds (#1b1b25)
- `--ui-text-placeholder` - Placeholder text (#a1a1af)

#### Accent Colors
- `--ui-accent-purple` - Primary purple (#4d5dd9)
- `--ui-accent-purple-light` - Light purple (#c1c8ff)
- `--ui-accent-purple-bg` - Purple background (rgba(193, 200, 255, 0.2))
- `--ui-accent-green` - Success/green (#c8ffc7)
- `--ui-accent-green-bg` - Green background (rgba(200, 255, 199, 0.2))
- `--ui-accent-orange` - Warning/orange (#f77834)
- `--ui-accent-blue` - Informational blue

#### Status Colors
- `--status-success` - Success state (#c8ffc7)
- `--status-warning` - Warning state (#f77834)
- `--status-error` - Error state

### 2. Updated Tailwind Configuration
**File:** `tailwind.config.js`

Added Tailwind utility classes for all design tokens:

```javascript
colors: {
  'ui-bg': {
    base: 'var(--ui-bg-base)',
    subtle: 'var(--ui-bg-subtle)',
    elevated: 'var(--ui-bg-elevated)',
    overlay: 'var(--ui-bg-overlay)',
    'overlay-hover': 'var(--ui-bg-overlay-hover)',
    input: 'var(--ui-bg-input)',
  },
  'ui-border': {
    base: 'var(--ui-border-base)',
    strong: 'var(--ui-border-strong)',
    focus: 'var(--ui-border-focus)',
  },
  'ui-text': {
    primary: 'var(--ui-text-primary)',
    secondary: 'var(--ui-text-secondary)',
    tertiary: 'var(--ui-text-tertiary)',
    dark: 'var(--ui-text-dark)',
    placeholder: 'var(--ui-text-placeholder)',
  },
  'ui-accent': {
    purple: 'var(--ui-accent-purple)',
    'purple-light': 'var(--ui-accent-purple-light)',
    'purple-bg': 'var(--ui-accent-purple-bg)',
    green: 'var(--ui-accent-green)',
    'green-bg': 'var(--ui-accent-green-bg)',
    orange: 'var(--ui-accent-orange)',
    blue: 'var(--ui-accent-blue)',
  },
  status: {
    success: 'var(--status-success)',
    warning: 'var(--status-warning)',
    error: 'var(--status-error)',
  },
}
```

### 3. Migrated Components

#### Fully Migrated
- ✅ `DomainOwnershipSelector.tsx`
- ✅ `DomainConfiguration.tsx`
- ✅ `theme-toggle.tsx`
- ✅ `TemplateCard.tsx` (partial - preview dialogs)

## Migration Pattern

### Before (Hardcoded)
```tsx
className="bg-[rgba(58,58,74,0.3)] border-[#575768] text-[#ffffff]"
```

### After (Design Tokens)
```tsx
className="bg-ui-bg-overlay border-ui-border-base text-ui-text-primary"
```

## Common Replacements

| Hardcoded Value | Design Token |
|----------------|--------------|
| `bg-[rgba(58,58,74,0.3)]` | `bg-ui-bg-overlay` |
| `bg-[rgba(75,75,94,0.3)]` | `bg-ui-bg-overlay-hover` |
| `bg-[rgba(51,51,61,0.3)]` | `bg-ui-bg-input` |
| `border-[#575768]` | `border-ui-border-base` |
| `border-[#c1c8ff]` | `border-ui-border-focus` |
| `text-[#ffffff]` | `text-ui-text-primary` |
| `text-[#bfbfc8]` | `text-ui-text-secondary` |
| `text-[#1b1b25]` | `text-ui-text-dark` |
| `text-[#a1a1af]` | `text-ui-text-placeholder` |
| `bg-[#4d5dd9]` | `bg-ui-accent-purple` |
| `text-[#c1c8ff]` | `text-ui-accent-purple-light` |
| `bg-[rgba(193,200,255,0.2)]` | `bg-ui-accent-purple-bg` |
| `bg-[#c8ffc7]` | `bg-ui-accent-green` |
| `bg-[rgba(200,255,199,0.2)]` | `bg-ui-accent-green-bg` |
| `border-[#c8ffc7]` | `border-ui-accent-green` |
| `text-[#c8ffc7]` | `text-ui-accent-green` |
| `border-[#f77834]` | `border-status-warning` |
| `text-[#f77834]` | `text-status-warning` |

## Remaining Files to Migrate

The following files still contain hardcoded color values and should be migrated using the same pattern:

### High Priority (Wizard Components)
- `src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/new/components/wizard/components/templates/CategoryTabs.tsx`
- `src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/new/components/wizard/components/WizardNavigation.tsx`
- `src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/new/components/wizard/components/ProjectSummary.tsx`
- `src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/new/components/wizard/components/ProjectDetailsSection.tsx`
- `src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/new/components/wizard/components/sections/RefineFieldsSection.tsx`

### Field Components
- `src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/new/components/wizard/components/fields/ProjectNameField.tsx`
- `src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/new/components/wizard/components/fields/ProjectDescriptionField.tsx`
- `src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/new/components/wizard/components/fields/UVPField.tsx`

### UI Components
- `src/components/ui/sidebar.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/ai-rewrite-menu.tsx`
- `src/components/ui/auto-complete.tsx`
- `src/components/ui/tags-input.tsx`

### Dashboard Components
- `src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/components/ActionCard.tsx`
- `src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/components/StatCard.tsx`

### Auth Components
- `src/components/auth/CustomSignIn.tsx`
- `src/components/auth/CustomSignUp.tsx`

### Other Components
- `src/components/assistant/ImageUploadControls.tsx`
- `src/components/template-preview/TemplatePreview.tsx`
- `src/components/ErrorFallback.tsx`
- `src/components/DatabaseOfflineHandler.tsx`
- `src/components/Footer.tsx`
- `src/app/Navbar.tsx`

### Error Pages
- `src/app/error.tsx`
- `src/app/global-error.tsx`
- `src/app/not-found.tsx`

### Help Pages
- `src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/help/page.tsx`
- `src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/help/getting-started/page.tsx`
- `src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/help/template-selection/page.tsx`
- `src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/help/customization/page.tsx`

## Benefits

1. **Consistency** - All colors come from a single source of truth
2. **Maintainability** - Update colors in one place (theme-colors.css)
3. **Dark Mode** - Automatic theme switching with proper dark mode variants
4. **Type Safety** - Tailwind autocomplete for all design tokens
5. **Accessibility** - Centralized color management for WCAG compliance

## Usage in New Components

When creating new components, always use design tokens:

```tsx
// ✅ Good
<div className="bg-ui-bg-overlay border-ui-border-base text-ui-text-primary">
  <button className="bg-ui-accent-purple hover:bg-ui-accent-purple-light">
    Click me
  </button>
</div>

// ❌ Avoid
<div className="bg-[#3a3a4a] border-[#575768] text-[#ffffff]">
  <button className="bg-[#4d5dd9] hover:bg-[#c1c8ff]">
    Click me
  </button>
</div>
```

## Testing

To verify the changes:

1. Run the development server:
   ```bash
   pnpm dev
   ```

2. Test both light and dark modes using the theme toggle

3. Check the wizard flow, especially:
   - Domain configuration screens
   - Template selection
   - Form inputs and validation states

4. Verify hover states and focus rings work correctly

## Notes

- The browser chrome dots in TemplateCard preview (red, yellow, green) are intentionally left as hardcoded values as they represent macOS window controls
- All design tokens support both light and dark modes automatically
- The tokens are defined identically in both light and dark mode for this wizard UI, but can be customized per mode if needed in the future
