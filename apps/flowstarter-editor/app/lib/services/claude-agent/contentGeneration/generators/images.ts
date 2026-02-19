/**
 * Images.md Generator
 */

import type { GeneratedAsset } from '../types';
import { findAsset } from '../context';

export function generateImagesMd(assets?: GeneratedAsset[]): string {
  if (!assets || assets.length === 0) {
    return `---
# AI-Generated Images
hero:
  url: null
  alt: "Hero image"
features: []
background:
  url: null
  alt: "Background image"
---
`;
  }

  const heroAsset = findAsset(assets, 'hero');
  const featureAssets = assets.filter(a => a.type === 'feature' || a.type === 'product');
  const backgroundAsset = findAsset(assets, 'background');

  const featureYaml = featureAssets.length > 0
    ? featureAssets.map(a => `  - url: "${a.url}"
    name: "${a.name}"
    alt: "${(a.prompt || a.name).replace(/"/g, "'")}"`).join('\n')
    : '  []';

  return `---
# AI-Generated Images (powered by fal.ai)
hero:
  url: "${heroAsset?.url || ''}"
  alt: "${(heroAsset?.prompt || 'Hero banner image').replace(/"/g, "'")}"
features:
${featureYaml}
background:
  url: "${backgroundAsset?.url || ''}"
  alt: "${(backgroundAsset?.prompt || 'Background image').replace(/"/g, "'")}"
generated_at: "${new Date().toISOString()}"
---
`;
}
