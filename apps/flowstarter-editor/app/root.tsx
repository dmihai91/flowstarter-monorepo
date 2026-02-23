import { useStore } from '@nanostores/react';
import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';
import tailwindReset from '@unocss/reset/tailwind-compat.css?url';
import { themeStore } from './lib/stores/theme';
import { stripIndents } from './utils/stripIndent';
import { createHead } from 'remix-island';
import { useEffect, useState, useMemo } from 'react';

import { ClientOnly } from 'remix-utils/client-only';
import { ToastContainer } from 'react-toastify';
import { AmplitudeProvider } from './components/AmplitudeProvider';
import { GTMProvider } from './components/GTMProvider';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { QueryProvider } from './components/QueryProvider';
import { ClerkProvider } from '@clerk/remix';
import { rootAuthLoader } from '@clerk/remix/ssr.server';
import { getClerkEnv } from './lib/clerk.server';

// Core styles - loaded immediately (critical for initial render)
import globalStyles from './styles/index.scss?url';

/*
 * Non-critical styles - URLs for deferred loading
 * These are loaded after initial render to improve startup time
 */
const reactToastifyStylesUrl = 'https://cdn.jsdelivr.net/npm/react-toastify@9/dist/ReactToastify.min.css';
const xtermStylesUrl = 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5/css/xterm.min.css';

import 'virtual:uno.css';

// Lazy singleton for Convex client - only initialized on client side
let convexClientSingleton: ConvexReactClient | null = null;

function getConvexClient(): ConvexReactClient | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!convexClientSingleton) {
    const convexUrl = import.meta.env.VITE_CONVEX_URL;

    if (convexUrl) {
      convexClientSingleton = new ConvexReactClient(convexUrl);
    }
  }

  return convexClientSingleton;
}

// Clerk loader - provides auth state to the app (optional)
export async function loader(args: LoaderFunctionArgs) {
  const { context } = args;
  const clerkEnv = getClerkEnv(context as any);
  
  // Only use Clerk if configured
  if (clerkEnv.publishableKey && clerkEnv.secretKey) {
    try {
      return rootAuthLoader(args, () => ({
        clerkPublishableKey: clerkEnv.publishableKey,
        clerkEnabled: true,
      }));
    } catch (error) {
      console.warn('Clerk SSR failed, falling back to client-only:', error);
    }
  }
  
  // Clerk not configured or failed - return basic data
  return {
    clerkPublishableKey: clerkEnv.publishableKey || '',
    clerkEnabled: false,
  };
}

export const links: LinksFunction = () => [
  // Favicons
  {
    rel: 'icon',
    href: '/icon-light.png',
    type: 'image/png',
    media: '(prefers-color-scheme: light)',
  },
  {
    rel: 'icon',
    href: '/icon-dark.png',
    type: 'image/png',
    media: '(prefers-color-scheme: dark)',
  },
  {
    rel: 'icon',
    href: '/icon-dark.png',
    type: 'image/png',
  },

  // Critical CSS - loaded immediately (render-blocking)
  { rel: 'stylesheet', href: tailwindReset },
  { rel: 'stylesheet', href: globalStyles },

  /*
   * Non-critical CSS - preloaded but not render-blocking
   * These will be loaded asynchronously after initial render
   */
  {
    rel: 'preload',
    href: reactToastifyStylesUrl,
    as: 'style',
  },
  {
    rel: 'preload',
    href: xtermStylesUrl,
    as: 'style',
  },

  // Font preconnect
  {
    rel: 'preconnect',
    href: 'https://fonts.googleapis.com',
  },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
];

const inlineThemeCode = stripIndents`
  setTutorialKitTheme();

  function setTutorialKitTheme() {
    let theme = localStorage.getItem('flowstarter_theme');

    // Resolve 'system' or missing theme to actual light/dark value
    if (!theme || theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.querySelector('html')?.setAttribute('data-theme', theme);
    updateFavicon(theme);
  }

  function updateFavicon(theme) {
    const iconLink = document.querySelector('link[rel="icon"]:not([media])');
    if (iconLink) {
      iconLink.href = theme === 'dark' ? '/icon-dark.png' : '/icon-light.png';
    }
  }
`;

export const Head = createHead(() => (
  <>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <Meta />
    <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} />
    <Links />
  </>
));

// Error screen when Convex is not configured
function ConvexNotConfiguredError() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          padding: '32px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h1 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>Convex Not Configured</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6, marginBottom: '24px' }}>
          The{' '}
          <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
            VITE_CONVEX_URL
          </code>{' '}
          environment variable is not set.
        </p>
        <div
          style={{
            textAlign: 'left',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '14px',
          }}
        >
          <p style={{ color: '#22d3ee', marginBottom: '8px' }}>To fix this:</p>
          <ol style={{ color: 'rgba(255, 255, 255, 0.7)', paddingLeft: '20px', margin: 0 }}>
            <li style={{ marginBottom: '4px' }}>
              Run <code style={{ color: '#22d3ee' }}>npx convex dev</code> to start Convex
            </li>
            <li style={{ marginBottom: '4px' }}>
              Set <code style={{ color: '#22d3ee' }}>VITE_CONVEX_URL=http://127.0.0.1:3210</code> in your{' '}
              <code style={{ color: '#22d3ee' }}>.env</code> file
            </li>
            <li>Restart the dev server</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// Wrapper component for Convex provider - uses lazy client initialization
function ConvexWrapper({ children }: { children: React.ReactNode }) {
  // Initialize client synchronously on first render (client-side only)
  const client = useMemo(() => {
    return getConvexClient();
  }, []);

  if (!client) {
    // Show helpful error when Convex is not configured
    return <ConvexNotConfiguredError />;
  }

  return (
    <ConvexProvider client={client}>
      <QueryProvider>{children}</QueryProvider>
    </ConvexProvider>
  );
}

// Component to lazy-load non-critical CSS after initial render
function DeferredStyles() {
  useEffect(() => {
    // Load non-critical stylesheets after initial render
    const loadStylesheet = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    };

    // Use requestIdleCallback for best performance, fallback to setTimeout
    const scheduleLoad = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(callback);
      } else {
        setTimeout(callback, 100);
      }
    };

    scheduleLoad(() => {
      loadStylesheet(reactToastifyStylesUrl);
      loadStylesheet(xtermStylesUrl);
    });
  }, []);

  return null;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useStore(themeStore);

  useEffect(() => {
    // Resolve 'system' to actual light/dark value for CSS
    const effectiveTheme =
      theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;

    document.querySelector('html')?.setAttribute('data-theme', effectiveTheme);

    const iconLink = document.querySelector('link[rel="icon"]:not([media])') as HTMLLinkElement;

    if (iconLink) {
      iconLink.href = effectiveTheme === 'dark' ? '/icon-dark.png' : '/icon-light.png';
    }
  }, [theme]);

  return (
    <>
      <ClientOnly>{() => <DeferredStyles />}</ClientOnly>
      <ClientOnly>{() => <AmplitudeProvider />}</ClientOnly>
      <ClientOnly>{() => <GTMProvider />}</ClientOnly>
      <ClientOnly>{() => <ConvexWrapper>{children}</ConvexWrapper>}</ClientOnly>
      <ClientOnly>{() => <ToastContainer />}</ClientOnly>
      <ScrollRestoration />
      <Scripts />
    </>
  );
}

import { logStore } from './lib/stores/logs';

export default function App() {
  const theme = useStore(themeStore);
  const loaderData = useLoaderData<typeof loader>();
  const clerkKey = loaderData?.clerkPublishableKey;

  useEffect(() => {
    logStore.logSystem('Application initialized', {
      theme,
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Only wrap with ClerkProvider if publishable key is configured
  const content = (
    <Layout>
      <Outlet />
    </Layout>
  );

  if (clerkKey) {
    return (
      <ClerkProvider publishableKey={clerkKey}>
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
