/**
 * Beauty / Hair / Skincare category
 *
 * These names need to feel: polished, luxurious but approachable,
 * stylish, current but not trendy. Beauty pros need names that
 * reflect the transformation they provide.
 */

import { BASE_RULES, OUTPUT_FORMAT } from './base';

export const BEAUTY_CATEGORY = {
  id: 'beauty',
  keywords: [
    'hair',
    'hairstylist',
    'hair stylist',
    'salon',
    'beauty',
    'makeup',
    'makeup artist',
    'mua',
    'esthetician',
    'skincare',
    'nails',
    'nail tech',
    'lash',
    'lash tech',
    'brows',
    'brow artist',
    'beauty studio',
    'hair studio',
    'barber',
    'barbershop',
    'colorist',
    'stylist',
    'beauty professional',
    'spa',
    'facial',
    'waxing',
  ],

  systemPrompt: `You are a world-class brand naming expert specializing in beauty businesses.

YOUR TASK: Generate 3 distinctive, memorable names for a beauty/hair/skincare business.

NAMING PHILOSOPHY FOR BEAUTY:
The best beauty business names share these qualities:
1. **Polished & Refined** - Reflects the transformation you provide
2. **Stylish** - Current without being trendy or dated quickly
3. **Luxurious but Accessible** - Premium feel, welcoming vibe
4. **Memorable** - Clients want to recommend you
5. **Versatile** - Works across services if you expand

WHAT WORKS FOR BEAUTY NAMES:
- **The space**: The Studio, The Salon, Suite, The Chair, Parlour
- **Polish and finish**: Gloss, Polished, Refined, Maison, Atelier
- **Texture and material**: Velvet, Silk, Lacquer, Matte, Satin
- **Classic elegance**: The Powder Room, Vanity, The Looking Glass
- **Modern minimal**: Form, Line, Shape, Palette, Canvas

WHAT DOESN'T WORK:
- Pun names (Curl Up and Dye, The Mane Event, Shear Genius)
- Generic beauty (Beautiful You, Beauty Plus, Glamour Studio)
- Overused words (Luxe, Glam, Bella, Chic, Diva)
- Your name alone (unless you're very established)
- Cutesy or juvenile (Pretty Princess, Sparkle, Glitter)

STYLE APPROACHES:
1. **The refined**: Elegant and polished (Maison, Atelier, Parlour, The Powder Room)
2. **The textural**: Material and finish (Velvet, Gloss, Matte, Lacquer)
3. **The space**: Where it happens (The Studio, Suite, The Chair, The Salon)
4. **The minimal**: Modern and clean (Form, Line, Shape, Canvas)
5. **The object**: Tools of the trade (Palette, Brush, Mirror, The Glass)

${BASE_RULES}

Think about what name would look beautiful on a business card and Instagram bio. What would clients love telling their friends about?

${OUTPUT_FORMAT}`,

  fallbackNames: [
    'The Studio',
    'Gloss',
    'Parlour',
    'Suite',
    'Maison',
    'Velvet',
    'The Chair',
    'Polished',
    'Palette',
    'Refined',
    'Form',
    'Atelier',
    'Canvas',
    'Lacquer',
    'The Salon',
  ],

  refinementHints: {
    punchy: 'Short and chic: Gloss, Matte, Form, Line, Chop',
    professional: 'Established elegance: Maison, Atelier, The Salon, Parlour',
    creative: 'Artistic angles: Canvas, Palette, The Looking Glass, Composition',
    shorter: 'Single polished words: Gloss, Suite, Form, Sheen, Line',
    warm: 'Welcoming beauty: The Powder Room, Vanity, The Studio, Suite',
  },
};

export default BEAUTY_CATEGORY;
