import { createFileRoute } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";

import { EmptyState } from "../components/EmptyState";
import { NoActiveThreadState } from "../components/NoActiveThreadState";
import { useTier } from "../hooks/useTier";
import {
  selectProjectsAcrossEnvironments,
  useStore,
} from "../store";

/**
 * Index of the `_chat` route. When the workspace has no projects and
 * the operator is an admin we surface the new-project EmptyState
 * (`/components/EmptyState.tsx`). Clients (and admins viewing an
 * already-populated workspace) keep the existing thread-empty fallback.
 */
function ChatIndexRouteView() {
  const tier = useTier();
  const projects = useStore(useShallow(selectProjectsAcrossEnvironments));

  const isAdmin = tier.role === "admin";
  const hasNoProjects = projects.length === 0;

  if (isAdmin && hasNoProjects) {
    return <EmptyState />;
  }

  return <NoActiveThreadState />;
}

export const Route = createFileRoute("/_chat/")({
  component: ChatIndexRouteView,
});
