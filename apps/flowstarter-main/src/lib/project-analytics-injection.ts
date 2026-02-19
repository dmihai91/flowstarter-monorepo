/**
 * Service to inject Google Analytics into user-generated projects
 */

interface ProjectConfig {
  gaMeasurementId?: string;
  // Add other analytics providers as needed
  fbPixelId?: string;
  plausibleDomain?: string;
}

/**
 * Generates Google Analytics script tags for injection into user projects
 */
export function generateGoogleAnalyticsScript(measurementId: string): string {
  return `<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${measurementId}');
</script>`;
}

/**
 * Generates a Google Analytics component for Next.js projects
 */
export function generateNextJsAnalyticsComponent(
  measurementId: string
): string {
  return `'use client';

import Script from 'next/script';

export function GoogleAnalytics() {
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {\`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
          });
        \`}
      </Script>
    </>
  );
}`;
}

/**
 * Injects analytics into HTML file content
 */
export function injectAnalyticsIntoHtml(
  htmlContent: string,
  config: ProjectConfig
): string {
  let modifiedHtml = htmlContent;

  // Inject Google Analytics if provided
  if (config.gaMeasurementId) {
    const gaScript = generateGoogleAnalyticsScript(config.gaMeasurementId);

    // Try to inject before closing </head> tag
    if (modifiedHtml.includes('</head>')) {
      modifiedHtml = modifiedHtml.replace('</head>', `${gaScript}\n</head>`);
    } else if (modifiedHtml.includes('<body>')) {
      // Fallback: inject after opening <body> tag
      modifiedHtml = modifiedHtml.replace('<body>', `<body>\n${gaScript}`);
    }
  }

  // Add other analytics providers here (Facebook Pixel, Plausible, etc.)
  if (config.fbPixelId) {
    const fbScript = generateFacebookPixelScript(config.fbPixelId);
    if (modifiedHtml.includes('</head>')) {
      modifiedHtml = modifiedHtml.replace('</head>', `${fbScript}\n</head>`);
    }
  }

  return modifiedHtml;
}

/**
 * Generates Facebook Pixel script
 */
function generateFacebookPixelScript(pixelId: string): string {
  return `<!-- Facebook Pixel -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${pixelId}');
  fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none"
    src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>
</noscript>`;
}

/**
 * Creates an analytics configuration form field for project settings
 */
export interface AnalyticsFormData {
  googleAnalytics: {
    enabled: boolean;
    measurementId: string;
  };
  facebookPixel: {
    enabled: boolean;
    pixelId: string;
  };
  plausible: {
    enabled: boolean;
    domain: string;
  };
}

/**
 * Validates analytics configuration
 */
export function validateAnalyticsConfig(config: ProjectConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.gaMeasurementId) {
    if (!config.gaMeasurementId.match(/^G-[A-Z0-9]+$/)) {
      errors.push(
        'Invalid Google Analytics Measurement ID format (should be G-XXXXXXXXXX)'
      );
    }
  }

  if (config.fbPixelId) {
    if (!config.fbPixelId.match(/^[0-9]+$/)) {
      errors.push('Invalid Facebook Pixel ID format (should be numeric)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gets analytics instructions for users
 */
export function getAnalyticsSetupInstructions(): string {
  return `
# Adding Analytics to Your Website

## Google Analytics 4

1. Go to https://analytics.google.com/
2. Create a new property
3. Get your Measurement ID (format: G-XXXXXXXXXX)
4. Add it in your project settings

## Facebook Pixel

1. Go to https://business.facebook.com/
2. Navigate to Events Manager
3. Create a new Pixel
4. Copy the Pixel ID
5. Add it in your project settings

## Benefits of Adding Analytics

- Track visitor behavior and traffic sources
- Understand which pages perform best
- Measure conversion rates
- Optimize your content based on data
- See real-time visitor activity
  `;
}
