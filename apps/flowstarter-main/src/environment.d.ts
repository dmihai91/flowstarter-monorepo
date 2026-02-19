declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      NODE_ENV: 'development' | 'production';
      SUPABASE_PROJECT_REF: string;
      SUPABASE_SERVICE_ROLE_KEY: string;

      // Clerk Authentication
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
      CLERK_SECRET_KEY: string;
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: string;
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: string;
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: string;
      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: string;

      // Webhook Secrets
      CLERK_WEBHOOK_SECRET?: string;
      STRIPE_WEBHOOK_SECRET?: string;

      // AI Audit
      AI_AUDIT_ENC_KEY: string;
    }
  }
}

// eslint-disable-next-line prettier/prettier
export {};
