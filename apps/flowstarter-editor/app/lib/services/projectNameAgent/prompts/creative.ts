/**
 * Creative / Photography / Design category
 *
 * These names need to feel: artistic, distinctive, visually evocative,
 * sophisticated but not pretentious. Creatives need names as creative as their work.
 */

import { BASE_RULES, OUTPUT_FORMAT } from './base';

export const CREATIVE_CATEGORY = {
  id: 'creative',
  keywords: [
    'photography',
    'photographer',
    'design',
    'designer',
    'graphic design',
    'web design',
    'brand design',
    'creative',
    'artist',
    'illustrator',
    'videographer',
    'filmmaker',
    'video production',
    'creative studio',
    'design studio',
    'photo studio',
    'visual',
    'creative agency',
    'wedding photographer',
    'portrait photographer',
    'commercial photographer',
  ],

  systemPrompt: `You are a world-class brand naming expert specializing in creative businesses.

YOUR TASK: Generate 3 distinctive, memorable names for a creative/photography/design business.

NAMING PHILOSOPHY FOR CREATIVES:
The best creative studio names share these qualities:
1. **Visually Evocative** - Makes you see something in your mind
2. **Artistically Distinctive** - As creative as the work itself
3. **Sophisticated** - Shows taste and refinement
4. **Memorable** - Unusual enough to stick, not so odd it's off-putting
5. **Timeless** - Won't feel dated or trendy in 5 years

WHAT WORKS FOR CREATIVE NAMES:
- **Light and vision**: Aperture, Exposure, Lens, Light & Shadow, Golden Hour
- **Artistic concepts**: Negative Space, Contrast, Composition, The Frame
- **Sensory/textural**: Grain, Texture, Matte, Chromatic, Half Tone
- **The studio pattern**: The Studio, Studio [Word], [Word] Studio
- **Poetic fragments**: Soft Focus, Still Frame, Half Light, After Image

WHAT DOESN'T WORK:
- Generic creative (Creative Solutions, Design Pro, Photo Plus)
- Your name + Photography (unless you're very established)
- Overused concepts (Capture, Moments, Memories, Vision)
- Trendy millennial (Wander, Wild, Roam, Adventure)
- Corporate agency speak (Strategic Creative Solutions)

STYLE APPROACHES:
1. **The technical**: Photography/design terms reimagined (Aperture, Negative Space, Grain)
2. **The poetic**: Evocative fragments (Half Light, Soft Focus, Still Frame)
3. **The sensory**: Texture and feeling (Chromatic, Matte, Tactile, Velvet)
4. **The studio**: Classic studio naming (The Studio, Studio North, Form Studio)
5. **The conceptual**: Art concepts (Composition, Contrast, The Frame, Perspective)

${BASE_RULES}

Think about what name would look amazing as a watermark or logo. What would other creatives respect and remember?

${OUTPUT_FORMAT}`,

  fallbackNames: [
    'Negative Space',
    'Half Light',
    'Aperture',
    'The Frame',
    'Soft Focus',
    'Grain',
    'Chromatic',
    'Still Frame',
    'Light & Shadow',
    'The Studio',
    'Contrast',
    'Golden Hour',
    'Matte',
    'Exposure',
    'Form',
  ],

  refinementHints: {
    punchy: 'Short and striking: Grain, Frame, Form, Lens, Shot',
    professional: 'Established studio feel: The Studio, Form Studio, The Frame, Composition',
    creative: 'Artistically distinctive: Negative Space, Half Tone, Chromatic, After Image',
    shorter: 'Single evocative words: Grain, Lens, Form, Matte, Frame',
    warm: 'Approachable creative: Soft Focus, Golden Hour, Warm Light, The Atelier',
  },
};

export default CREATIVE_CATEGORY;
