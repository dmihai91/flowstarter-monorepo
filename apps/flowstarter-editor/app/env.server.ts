import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

/**
 * Server-side environment variables for the Flowstarter Editor (Remix + Vite).
 *
 * Import this file ONLY in server-side code (loaders, actions, *.server.ts).
 * For client-side env vars, use `import.meta.env.VITE_*` directly —
 * Vite inlines those at build time.
 */
export const env = createEnv({
  server: {
    // ── AI Providers ──────────────────────────────────────────────────
    OPEN_ROUTER_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),

    // ── Convex (Real-time Backend) ────────────────────────────────────
    CONVEX_URL: z.string().url().optional(),
    CONVEX_SITE_URL: z.string().url().optional(),

    // ── Daytona Sandbox ───────────────────────────────────────────────
    DAYTONA_API_KEY: z.string().optional(),
    DAYTONA_API_URL: z.string().url().default('https://app.daytona.io/api'),

    // ── FAL (Image Generation) ────────────────────────────────────────
    FAL_KEY: z.string().optional(),

    // ── Tavily Search ─────────────────────────────────────────────────
    TAVILY_API_KEY: z.string().optional(),

    // ── Supabase ──────────────────────────────────────────────────────
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_ANON_KEY: z.string().optional(),

    // ── Clerk Authentication ──────────────────────────────────────────
    CLERK_PUBLISHABLE_KEY: z.string().optional(),
    CLERK_SECRET_KEY: z.string().optional(),

    // ── Cross-app Communication ───────────────────────────────────────
    HANDOFF_SECRET: z.string().optional(),
    MAIN_PLATFORM_URL: z.string().url().optional(),

    // ── Cloudflare (Publishing) ───────────────────────────────────────
    CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
    CLOUDFLARE_API_TOKEN: z.string().optional(),

    // ── LangSmith Tracing ─────────────────────────────────────────────
    LANGSMITH_API_KEY: z.string().optional(),
    LANGSMITH_PROJECT: z.string().default('claude-code-trace'),

    // ── Runtime ───────────────────────────────────────────────────────
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },

  /**
   * Client-side env vars for Vite use the `VITE_` prefix.
   * These are inlined at build time by Vite and accessed via `import.meta.env`.
   */
  clientPrefix: 'VITE_',
  client: {
    VITE_CONVEX_URL: z.string().optional(),
    VITE_MAIN_PLATFORM_URL: z.string().optional(),
    VITE_PREVIEW_DOMAIN: z.string().default('flowstarter.app'),
    VITE_CALENDLY_DISCOVERY_URL: z.string().optional(),
    VITE_API_BASE_URL: z.string().optional(),
    VITE_SIGN_IN_URL: z.string().optional(),
    VITE_SIGN_UP_URL: z.string().optional(),
    VITE_FLOWSTARTER_MCP_URL: z.string().default('http://localhost:3001'),
    VITE_SUPABASE_URL: z.string().optional(),
    VITE_SUPABASE_ANON_KEY: z.string().optional(),
    VITE_OPENROUTER_API_KEY: z.string().optional(),
    VITE_OPENROUTER_MODEL: z.string().optional(),
    VITE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
    VITE_GITHUB_ACCESS_TOKEN: z.string().optional(),
    VITE_GITHUB_TOKEN_TYPE: z.enum(['classic', 'fine-grained']).default('classic'),
  },

  /*
   * ─── Runtime values ──────────────────────────────────────────────────
   */
  runtimeEnv: {
    // Server
    OPEN_ROUTER_API_KEY: process.env.OPEN_ROUTER_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    CONVEX_URL: process.env.CONVEX_URL,
    CONVEX_SITE_URL: process.env.CONVEX_SITE_URL,
    DAYTONA_API_KEY: process.env.DAYTONA_API_KEY,
    DAYTONA_API_URL: process.env.DAYTONA_API_URL,
    FAL_KEY: process.env.FAL_KEY,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    HANDOFF_SECRET: process.env.HANDOFF_SECRET,
    MAIN_PLATFORM_URL: process.env.MAIN_PLATFORM_URL,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY,
    LANGSMITH_PROJECT: process.env.LANGSMITH_PROJECT,
    NODE_ENV: process.env.NODE_ENV,

    // Client (VITE_ prefix — also available via process.env on the server)
    VITE_CONVEX_URL: process.env.VITE_CONVEX_URL,
    VITE_MAIN_PLATFORM_URL: process.env.VITE_MAIN_PLATFORM_URL,
    VITE_PREVIEW_DOMAIN: process.env.VITE_PREVIEW_DOMAIN,
    VITE_CALENDLY_DISCOVERY_URL: process.env.VITE_CALENDLY_DISCOVERY_URL,
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
    VITE_SIGN_IN_URL: process.env.VITE_SIGN_IN_URL,
    VITE_SIGN_UP_URL: process.env.VITE_SIGN_UP_URL,
    VITE_FLOWSTARTER_MCP_URL: process.env.VITE_FLOWSTARTER_MCP_URL,
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    VITE_OPENROUTER_API_KEY: process.env.VITE_OPENROUTER_API_KEY,
    VITE_OPENROUTER_MODEL: process.env.VITE_OPENROUTER_MODEL,
    VITE_LOG_LEVEL: process.env.VITE_LOG_LEVEL,
    VITE_GITHUB_ACCESS_TOKEN: process.env.VITE_GITHUB_ACCESS_TOKEN,
    VITE_GITHUB_TOKEN_TYPE: process.env.VITE_GITHUB_TOKEN_TYPE,
  },

  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
