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

const queryClient = new QueryClient();

// useAuth() must live inside ClerkProvider — keep it in its own component so
// App stays usable in the no-Clerk build (no conditional hooks).
function ClerkBridge() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  return (
    <App
      getToken={getToken}
      authReady={isLoaded}
      signedIn={!!isSignedIn}
      onSignIn={() => clerk.openSignIn({})}
    />
  );
}

const container = document.getElementById("root");
if (!container) throw new Error("Root container #root not found");

createRoot(container).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {publishableKey ? (
        <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
          <ClerkBridge />
        </ClerkProvider>
      ) : (
        <App />
      )}
    </QueryClientProvider>
  </React.StrictMode>,
);
