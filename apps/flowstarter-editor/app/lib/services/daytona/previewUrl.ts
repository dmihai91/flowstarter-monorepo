export interface PreviewLinkShape {
  href?: string;
  previewUrl?: string;
  url?: string;
}

export interface PreviewResultShape {
  previewUrl?: string;
  url?: string;
}

export function extractPreviewUrlValue(previewLink: unknown): string | null {
  if (typeof previewLink === 'string') {
    return previewLink;
  }

  if (!previewLink || typeof previewLink !== 'object') {
    return null;
  }

  const candidate = previewLink as PreviewLinkShape;
  return candidate.url || candidate.previewUrl || candidate.href || null;
}

export function resolvePreviewUrlFromResult(result: PreviewResultShape | null | undefined): string | null {
  if (!result) {
    return null;
  }

  return result.previewUrl || result.url || null;
}
