/**
 * Environment variable types are now validated at runtime by T3 Env.
 *
 * @see ./env.ts for the schema definition and validation.
 *
 * Usage:
 *   import { env } from "@/env";
 *   env.CLERK_SECRET_KEY  // ✅ type-safe, validated at startup
 *
 * DO NOT use `process.env.*` directly — import from `@/env` instead.
 */

// Re-export for backwards compatibility with code still using process.env
// These types match what T3 Env validates.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Skip env validation (set to "1" in Docker builds / CI)
      SKIP_ENV_VALIDATION?: string;
    }
  }
}

export {};
