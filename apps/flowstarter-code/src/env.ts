import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /*
   * ─── Server-side Environment Variables ───────────────────────────────
   */
  server: {
    // Authentik SSO
    AUTHENTIK_ISSUER: z.string().url(),
    AUTHENTIK_CLIENT_ID: z.string().min(1),
    AUTHENTIK_CLIENT_SECRET: z.string().min(1),

    // NextAuth
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url().default("http://localhost:3100"),

    // T3 Chat integration
    T3_CHAT_URL: z.string().url().default("http://localhost:3000"),

    // Runtime
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },

  /*
   * ─── Client-side Environment Variables ───────────────────────────────
   * No client-side env vars for this app currently.
   */
  client: {},

  /*
   * ─── Runtime values ──────────────────────────────────────────────────
   */
  runtimeEnv: {
    AUTHENTIK_ISSUER: process.env.AUTHENTIK_ISSUER,
    AUTHENTIK_CLIENT_ID: process.env.AUTHENTIK_CLIENT_ID,
    AUTHENTIK_CLIENT_SECRET: process.env.AUTHENTIK_CLIENT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    T3_CHAT_URL: process.env.T3_CHAT_URL,
    NODE_ENV: process.env.NODE_ENV,
  },

  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
