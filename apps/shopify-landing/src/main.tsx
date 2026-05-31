import React from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider, useAuth, useClerk } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import "./styles.css";

// Same Clerk instance + domain as the editor. Loading Clerk JS here keeps the
// session fresh and lets us mint a real session token for the usage fetch —
// without it, a bare fetch fails dev-instance auth (the dev-browser handshake).
// Missing key (e.g. a static / no-auth build) → render without Clerk; the
// usage tile then shows its neutral "—" placeholder.
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

// Branded Flowstarter sign-in page (the main app's /login). When set, "Sign in"
// redirects there — same as the editor — instead of Clerk's stock modal. Clerk
// carries the dev-browser token across the redirect for us.
const signInUrl = (import.meta.env.VITE_MAIN_APP_LOGIN_URL as string | undefined)?.trim() || undefined;

const queryClient = new QueryClient();

// Sign-in/up live on the main app (cross-origin), so Clerk navigation must be a
// whole-page redirect, not SPA pushState.
const navigate = (to: string) => {
  if (typeof window !== "undefined") window.location.href = to;
};
const navigateReplace = (to: string) => {
  if (typeof window !== "undefined") window.location.replace(to);
};

// useAuth()/useClerk() must live inside ClerkProvider — keep them in their own
// component so App stays usable in the no-Clerk build (no conditional hooks).
function ClerkBridge() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  return (
    <App
      getToken={getToken}
      authReady={isLoaded}
      signedIn={!!isSignedIn}
      // Redirect to the branded /login (signInUrl) and come back here after.
      onSignIn={() => clerk.redirectToSignIn({ redirectUrl: window.location.href })}
    />
  );
}

const container = document.getElementById("root");
if (!container) throw new Error("Root container #root not found");

createRoot(container).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {publishableKey ? (
        <ClerkProvider
          publishableKey={publishableKey}
          afterSignOutUrl="/"
          routerPush={navigate}
          routerReplace={navigateReplace}
          {...(signInUrl ? { signInUrl } : {})}
        >
          <ClerkBridge />
        </ClerkProvider>
      ) : (
        <App />
      )}
    </QueryClientProvider>
  </React.StrictMode>,
);
