/**
 * Analytics Integration
 * Injects tracking scripts into Layout.astro <head>.
 * Supports: Google Analytics (GA4), Plausible, Fathom.
 */

export type AnalyticsProvider = 'ga4' | 'plausible' | 'fathom';

export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  id: string; // GA4: G-XXXXXXX, Plausible: domain, Fathom: site ID
}

function ga4Script(measurementId: string): string {
  return `\n    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${measurementId}');</script>`;
}

function plausibleScript(domain: string): string {
  return `\n    <!-- Plausible Analytics -->
    <script defer data-domain="${domain}" src="https://plausible.io/js/script.js"></script>`;
}

function fathomScript(siteId: string): string {
  return `\n    <!-- Fathom Analytics -->
    <script src="https://cdn.usefathom.com/script.js" data-site="${siteId}" defer></script>`;
}

export function injectAnalytics(
  files: Array<{ path: string; content: string }>,
  config: AnalyticsConfig,
): Array<{ path: string; content: string }> {
  const scriptMap: Record<AnalyticsProvider, (id: string) => string> = {
    ga4: ga4Script,
    plausible: plausibleScript,
    fathom: fathomScript,
  };

  const script = scriptMap[config.provider]?.(config.id);
  if (!script) return files;

  return files.map((file) => {
    if ((file.path.includes('Layout.astro') || file.path.includes('layout.astro')) && !file.content.includes(config.id)) {
      return { ...file, content: file.content.replace('</head>', `${script}\n  </head>`) };
    }
    return file;
  });
}
