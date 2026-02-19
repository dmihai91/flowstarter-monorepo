/**
 * Predefined Font Pairings for Website Customization
 */

export interface FontSizeScale {
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  body: string;
  small: string;
}

export interface FontPairing {
  id: string;
  name: string;
  description: string;
  heading: {
    family: string;
    weight: number;
  };
  body: {
    family: string;
    weight: number;
  };
  sizes: FontSizeScale;
  googleFonts: string; // Google Fonts URL param
}

export const PREDEFINED_FONT_PAIRINGS: FontPairing[] = [
  // ===== GENERAL PURPOSE =====
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and balanced',
    heading: { family: 'Inter', weight: 700 },
    body: { family: 'Inter', weight: 400 },
    sizes: { h1: '3rem', h2: '2.25rem', h3: '1.5rem', h4: '1.25rem', body: '1rem', small: '0.875rem' },
    googleFonts: 'Inter:wght@400;500;600;700',
  },
  {
    id: 'bold-impact',
    name: 'Bold Impact',
    description: 'Large headlines, compact body',
    heading: { family: 'Montserrat', weight: 800 },
    body: { family: 'Open Sans', weight: 400 },
    sizes: { h1: '4.5rem', h2: '3rem', h3: '2rem', h4: '1.5rem', body: '0.9375rem', small: '0.8125rem' },
    googleFonts: 'Montserrat:wght@600;800&family=Open+Sans:wght@400;600',
  },
  {
    id: 'minimal-tight',
    name: 'Minimal Tight',
    description: 'Compact and space-efficient',
    heading: { family: 'DM Sans', weight: 600 },
    body: { family: 'DM Sans', weight: 400 },
    sizes: { h1: '2.5rem', h2: '1.875rem', h3: '1.25rem', h4: '1.125rem', body: '0.875rem', small: '0.75rem' },
    googleFonts: 'DM+Sans:wght@400;500;600;700',
  },
  {
    id: 'tech-mono',
    name: 'Tech Mono',
    description: 'Developer-friendly, medium scale',
    heading: { family: 'JetBrains Mono', weight: 700 },
    body: { family: 'IBM Plex Sans', weight: 400 },
    sizes: { h1: '2.75rem', h2: '2rem', h3: '1.5rem', h4: '1.25rem', body: '0.9375rem', small: '0.8125rem' },
    googleFonts: 'JetBrains+Mono:wght@500;700&family=IBM+Plex+Sans:wght@400;500',
  },
  {
    id: 'geometric-sharp',
    name: 'Geometric Sharp',
    description: 'Angular with strong hierarchy',
    heading: { family: 'Urbanist', weight: 700 },
    body: { family: 'Urbanist', weight: 400 },
    sizes: { h1: '3.75rem', h2: '2.625rem', h3: '1.75rem', h4: '1.375rem', body: '1rem', small: '0.875rem' },
    googleFonts: 'Urbanist:wght@400;500;600;700',
  },
  {
    id: 'futuristic-display',
    name: 'Futuristic Display',
    description: 'Sci-fi hero sections',
    heading: { family: 'Orbitron', weight: 700 },
    body: { family: 'Exo 2', weight: 400 },
    sizes: { h1: '4.25rem', h2: '2.875rem', h3: '1.875rem', h4: '1.375rem', body: '0.9375rem', small: '0.8125rem' },
    googleFonts: 'Orbitron:wght@600;700&family=Exo+2:wght@400;500',
  },

  // ===== FEMININE & ELEGANT =====
  {
    id: 'feminine-luxe',
    name: 'Feminine Luxe',
    description: 'Beauty & fashion elegance',
    heading: { family: 'Cormorant Garamond', weight: 600 },
    body: { family: 'Raleway', weight: 400 },
    sizes: { h1: '3.5rem', h2: '2.5rem', h3: '1.75rem', h4: '1.375rem', body: '1rem', small: '0.875rem' },
    googleFonts: 'Cormorant+Garamond:wght@500;600;700&family=Raleway:wght@400;500',
  },
  {
    id: 'soft-romantic',
    name: 'Soft Romantic',
    description: 'Delicate and dreamy',
    heading: { family: 'Playfair Display', weight: 500 },
    body: { family: 'Quicksand', weight: 400 },
    sizes: { h1: '3.25rem', h2: '2.375rem', h3: '1.625rem', h4: '1.25rem', body: '1.0625rem', small: '0.9375rem' },
    googleFonts: 'Playfair+Display:wght@500;600;700&family=Quicksand:wght@400;500',
  },
  {
    id: 'graceful-serif',
    name: 'Graceful Serif',
    description: 'Timeless feminine beauty',
    heading: { family: 'Bodoni Moda', weight: 600 },
    body: { family: 'Nunito Sans', weight: 400 },
    sizes: { h1: '3.75rem', h2: '2.625rem', h3: '1.75rem', h4: '1.375rem', body: '1rem', small: '0.875rem' },
    googleFonts: 'Bodoni+Moda:wght@500;600;700&family=Nunito+Sans:wght@400;500',
  },
  {
    id: 'airy-light',
    name: 'Airy Light',
    description: 'Light and breezy wellness',
    heading: { family: 'Josefin Sans', weight: 600 },
    body: { family: 'Lato', weight: 300 },
    sizes: { h1: '3rem', h2: '2.25rem', h3: '1.5rem', h4: '1.25rem', body: '1.0625rem', small: '0.9375rem' },
    googleFonts: 'Josefin+Sans:wght@400;600;700&family=Lato:wght@300;400',
  },
  {
    id: 'blush-elegance',
    name: 'Blush Elegance',
    description: 'Refined bridal & beauty',
    heading: { family: 'Cinzel', weight: 500 },
    body: { family: 'EB Garamond', weight: 400 },
    sizes: { h1: '3.25rem', h2: '2.375rem', h3: '1.625rem', h4: '1.375rem', body: '1.125rem', small: '1rem' },
    googleFonts: 'Cinzel:wght@500;600;700&family=EB+Garamond:wght@400;500',
  },
  {
    id: 'botanical-chic',
    name: 'Botanical Chic',
    description: 'Nature-inspired sophistication',
    heading: { family: 'Gilda Display', weight: 400 },
    body: { family: 'Karla', weight: 400 },
    sizes: { h1: '3.5rem', h2: '2.5rem', h3: '1.75rem', h4: '1.375rem', body: '1rem', small: '0.875rem' },
    googleFonts: 'Gilda+Display&family=Karla:wght@400;500',
  },

  // ===== CLASSIC & EDITORIAL =====
  {
    id: 'elegant-editorial',
    name: 'Elegant Editorial',
    description: 'Refined serif with generous sizing',
    heading: { family: 'Playfair Display', weight: 700 },
    body: { family: 'Source Sans Pro', weight: 400 },
    sizes: { h1: '3.5rem', h2: '2.5rem', h3: '1.75rem', h4: '1.375rem', body: '1.0625rem', small: '0.9375rem' },
    googleFonts: 'Playfair+Display:wght@700&family=Source+Sans+Pro:wght@400;600',
  },
  {
    id: 'classic-readable',
    name: 'Classic Readable',
    description: 'Traditional with larger body text',
    heading: { family: 'Lora', weight: 700 },
    body: { family: 'Merriweather', weight: 400 },
    sizes: { h1: '3rem', h2: '2.25rem', h3: '1.625rem', h4: '1.375rem', body: '1.125rem', small: '1rem' },
    googleFonts: 'Lora:wght@600;700&family=Merriweather:wght@400',
  },

  // ===== WARM & FRIENDLY =====
  {
    id: 'playful-large',
    name: 'Playful Large',
    description: 'Fun and oversized',
    heading: { family: 'Grandstander', weight: 700 },
    body: { family: 'Lexend', weight: 400 },
    sizes: { h1: '4rem', h2: '2.75rem', h3: '1.875rem', h4: '1.5rem', body: '1.0625rem', small: '0.9375rem' },
    googleFonts: 'Grandstander:wght@600;700&family=Lexend:wght@400;500',
  },
  {
    id: 'warm-cozy',
    name: 'Warm & Cozy',
    description: 'Soft and inviting sizes',
    heading: { family: 'Fraunces', weight: 700 },
    body: { family: 'Commissioner', weight: 400 },
    sizes: { h1: '3.25rem', h2: '2.375rem', h3: '1.625rem', h4: '1.25rem', body: '1.0625rem', small: '0.9375rem' },
    googleFonts: 'Fraunces:wght@600;700&family=Commissioner:wght@400;500',
  },

  // ===== SPECIAL PURPOSE =====
  {
    id: 'condensed-punch',
    name: 'Condensed Punch',
    description: 'Tall headers, tight spacing',
    heading: { family: 'Bebas Neue', weight: 400 },
    body: { family: 'Rubik', weight: 400 },
    sizes: { h1: '5rem', h2: '3.5rem', h3: '2.25rem', h4: '1.75rem', body: '1rem', small: '0.875rem' },
    googleFonts: 'Bebas+Neue&family=Rubik:wght@400;500',
  },
  {
    id: 'accessibility-first',
    name: 'Accessibility First',
    description: 'Extra-large for readability',
    heading: { family: 'Lexend', weight: 600 },
    body: { family: 'Atkinson Hyperlegible', weight: 400 },
    sizes: { h1: '3.5rem', h2: '2.5rem', h3: '1.75rem', h4: '1.5rem', body: '1.1875rem', small: '1.0625rem' },
    googleFonts: 'Lexend:wght@500;600;700&family=Atkinson+Hyperlegible:wght@400',
  },
];

/**
 * Popular Google Fonts for custom selection
 */
export const POPULAR_FONTS = [
  // Sans-Serif - Modern & Clean
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Source Sans Pro',
  'Nunito',
  'Raleway',
  'Ubuntu',
  'DM Sans',
  'Work Sans',
  'Manrope',
  'Outfit',
  'Plus Jakarta Sans',
  'Figtree',
  'Albert Sans',
  'Urbanist',
  'Lexend',
  'Sora',

  // Sans-Serif - Geometric
  'Space Grotesk',
  'Archivo',
  'Josefin Sans',
  'Comfortaa',
  'Quicksand',
  'Karla',
  'Cabin',
  'Rubik',
  'Exo 2',
  'Barlow',

  // Sans-Serif - Display
  'Bebas Neue',
  'Archivo Black',
  'Oswald',
  'Barlow Condensed',
  'Orbitron',
  'Bricolage Grotesque',
  'Grandstander',

  // Serif - Traditional
  'Playfair Display',
  'Merriweather',
  'Lora',
  'PT Serif',
  'Libre Baskerville',
  'EB Garamond',
  'Cormorant Garamond',
  'Spectral',
  'Crimson Pro',
  'Source Serif 4',
  'Newsreader',

  // Serif - Display
  'Fraunces',
  'Poiret One',
  'Tenor Sans',

  // Feminine & Elegant
  'Bodoni Moda',
  'Cinzel',
  'Gilda Display',
  'Italiana',
  'Marcellus',
  'Tangerine',
  'Great Vibes',
  'Pinyon Script',
  'Alex Brush',
  'Allura',
  'Sacramento',

  // Slab Serif
  'Roboto Slab',
  'Arvo',
  'Zilla Slab',

  // Monospace
  'JetBrains Mono',
  'IBM Plex Mono',
  'Fira Code',
  'Source Code Pro',
  'Space Mono',

  // Accessibility-focused
  'Atkinson Hyperlegible',
  'Commissioner',
  'Hind',
];

export const DEFAULT_FONTS = PREDEFINED_FONT_PAIRINGS[0];

/**
 * Generate Google Fonts link URL
 */
export function generateGoogleFontsUrl(fonts: FontPairing): string {
  return `https://fonts.googleapis.com/css2?family=${fonts.googleFonts}&display=swap`;
}

/**
 * Generate Tailwind config font families from pairing
 */
export function generateTailwindFonts(fonts: FontPairing): string {
  return `
    fontFamily: {
      heading: ['${fonts.heading.family}', 'sans-serif'],
      body: ['${fonts.body.family}', 'sans-serif'],
    },
    fontSize: {
      'h1': '${fonts.sizes.h1}',
      'h2': '${fonts.sizes.h2}',
      'h3': '${fonts.sizes.h3}',
      'h4': '${fonts.sizes.h4}',
      'body': '${fonts.sizes.body}',
      'small': '${fonts.sizes.small}',
    },`;
}

/**
 * Generate CSS custom properties for font sizes
 */
export function generateFontSizeVars(fonts: FontPairing): string {
  return `
  --font-size-h1: ${fonts.sizes.h1};
  --font-size-h2: ${fonts.sizes.h2};
  --font-size-h3: ${fonts.sizes.h3};
  --font-size-h4: ${fonts.sizes.h4};
  --font-size-body: ${fonts.sizes.body};
  --font-size-small: ${fonts.sizes.small};`;
}

/**
 * Generate HTML link tag for Google Fonts
 */
export function generateGoogleFontsLink(fonts: FontPairing): string {
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${generateGoogleFontsUrl(fonts)}" rel="stylesheet">`;
}

