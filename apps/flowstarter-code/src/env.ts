import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /*
   * ─── Server-side Environment Variables ───────────────────────────────
   */
  server: {
    // Clerk
    CLERK_SECRET_KEY: z.string().min(1),

    // Self-hosted Flowstarter Code integration
    FLOWSTARTER_CODE_URL: z.string().min(1).default("/t3"),

    // Runtime
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },

  /*
   * ─── Client-side Environment Variables ───────────────────────────────
   */
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  },

  /*
   * ─── Runtime values ──────────────────────────────────────────────────
   */
  runtimeEnv: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    FLOWSTARTER_CODE_URL: process.env.FLOWSTARTER_CODE_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
  },

  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
