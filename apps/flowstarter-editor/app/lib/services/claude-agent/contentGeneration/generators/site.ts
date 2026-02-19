/**
 * Site.md Generator
 */

import type { ContentContext } from '../types';
import { pickRandom } from '../context';

export function generateSiteMd(
  siteName: string,
  businessInfo: any,
  year: number,
  ctx: ContentContext
): string {
  const name = businessInfo.name || siteName;
  const tagline = businessInfo.tagline || pickRandom(ctx.suggestions.headlines);
  const description = businessInfo.description || `${name} - ${tagline}`;

  return `---
name: "${name}"
tagline: "${tagline}"
description: "${description}"
domain: "${ctx.domain.id}"
year: ${year}
---
`;
}
