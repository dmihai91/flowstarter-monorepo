import { createElement } from "react";
import { QueryClient } from "@tanstack/react-query";
import { createRouter, RouterHistory } from "@tanstack/react-router";

import { AppAtomRegistryProvider } from "./rpc/atomRegistry";
import { routeTree } from "./routeTree.gen";

// Mirror Vite's `base` so TanStack Router keeps the prefix in URLs and
// link generation. Vite strips its base from `import.meta.env.BASE_URL`
// trailing slash to '/editor/' → '/editor'. When deployed at root,
// BASE_URL is '/' and basepath becomes '' (TanStack default).
const baseUrl = (import.meta.env.BASE_URL ?? "/").replace(/\/+$/, "");

export function getRouter(history: RouterHistory, queryClient: QueryClient) {
  return createRouter({
    routeTree,
    history,
    ...(baseUrl ? { basepath: baseUrl } : {}),
    context: {
      queryClient,
    },
    Wrap: ({ children }) =>
      createElement(AppAtomRegistryProvider, undefined, children),
  });
}

export type AppRouter = ReturnType<typeof getRouter>;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
