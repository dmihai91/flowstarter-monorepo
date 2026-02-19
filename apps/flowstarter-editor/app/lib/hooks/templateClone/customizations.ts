/**
 * Template Customization Helpers
 *
 * Apply color palette and fonts to template files.
 */

import type { ColorPalette } from '~/lib/config/palettes';
import type { FontPairing } from '~/lib/config/fonts';
import type { ScaffoldFile } from './types';

/**
 * Apply color palette and fonts to template files
 */
export function applyCustomizations(files: ScaffoldFile[], palette: ColorPalette, fonts: FontPairing): ScaffoldFile[] {
  return files.map((file) => {
    let content = file.content;

    // Apply to tailwind.config.ts or tailwind.config.js
    if (file.path.includes('tailwind.config')) {
      content = injectTailwindConfig(content, palette, fonts);
    }

    // Apply to index.html (Google Fonts link)
    if (file.path.endsWith('index.html') || file.path.endsWith('.html')) {
      content = injectGoogleFonts(content, fonts);
    }

    // Apply to CSS files (custom properties)
    if (file.path.endsWith('.css')) {
      content = injectCSSVariables(content, palette, fonts);
    }

    return {
      ...file,
      content,
    };
  });
}

/**
 * Inject color palette and fonts into Tailwind config
 */
export function injectTailwindConfig(content: string, palette: ColorPalette, fonts: FontPairing): string {
  const colorsConfig = `
      colors: {
        primary: '${palette.colors.primary}',
        secondary: '${palette.colors.secondary}',
        accent: '${palette.colors.accent}',
        background: '${palette.colors.background}',
        foreground: '${palette.colors.text}',
      },`;

  const fontsConfig = `
      fontFamily: {
        heading: ['${fonts.heading.family}', 'sans-serif'],
        body: ['${fonts.body.family}', 'sans-serif'],
      },`;

  // Look for extend: { and inject our config
  if (content.includes('extend: {')) {
    content = content.replace('extend: {', `extend: {\n${colorsConfig}\n${fontsConfig}`);
  } else if (content.includes('theme: {')) {
    // If no extend, add it to theme
    content = content.replace('theme: {', `theme: {\n    extend: {\n${colorsConfig}\n${fontsConfig}\n    },`);
  }

  return content;
}

/**
 * Inject Google Fonts link into HTML
 */
export function injectGoogleFonts(content: string, fonts: FontPairing): string {
  // Don't add if already has Google Fonts
  if (content.includes('fonts.googleapis.com')) {
    return content;
  }

  const googleFontsLink = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${fonts.googleFonts}&display=swap" rel="stylesheet">`;

  // Insert before </head>
  if (content.includes('</head>')) {
    content = content.replace('</head>', `${googleFontsLink}\n  </head>`);
  }

  return content;
}

/**
 * Inject CSS custom properties for colors
 */
export function injectCSSVariables(content: string, palette: ColorPalette, fonts: FontPairing): string {
  const cssVars = `
:root {
  --color-primary: ${palette.colors.primary};
  --color-secondary: ${palette.colors.secondary};
  --color-accent: ${palette.colors.accent};
  --color-background: ${palette.colors.background};
  --color-text: ${palette.colors.text};
  --font-heading: '${fonts.heading.family}', sans-serif;
  --font-body: '${fonts.body.family}', sans-serif;
}
`;

  // Add at the beginning of CSS file
  if (content.includes(':root')) {
    // Already has :root, try to append our variables
    content = content.replace(
      ':root {',
      `:root {\n  /* Custom Palette */\n  --color-primary: ${palette.colors.primary};\n  --color-secondary: ${palette.colors.secondary};\n  --color-accent: ${palette.colors.accent};`,
    );
  } else {
    content = cssVars + content;
  }

  return content;
}

