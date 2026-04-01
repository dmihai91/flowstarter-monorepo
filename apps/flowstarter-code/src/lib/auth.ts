import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [
    {
      id: "authentik",
      name: "Flowstarter SSO",
      type: "oidc",
      issuer: process.env.AUTHENTIK_ISSUER,
      clientId: process.env.AUTHENTIK_CLIENT_ID,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
    },
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Required for middleware-based route protection
    authorized({ auth }) {
      return !!auth?.user;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token;
        token.id = profile.sub;
        // Persist name + email from the OIDC profile
        token.name = (profile.name as string | undefined)
          ?? (profile.preferred_username as string | undefined)
          ?? token.name;
        token.email = (profile.email as string | undefined) ?? token.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id)    session.user.id    = token.id    as string;
      if (token.name)  session.user.name  = token.name  as string;
      if (token.email) session.user.email = token.email as string;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
