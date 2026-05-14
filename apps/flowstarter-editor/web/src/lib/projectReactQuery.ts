import type {
  EnvironmentId,
  ProjectListWorkspaceEntriesInput,
  ProjectReadWorkspaceFileInput,
  ProjectSearchEntriesResult,
} from "@flowstarter/editor-contracts";
import { queryOptions } from "@tanstack/react-query";
import { ensureEnvironmentApi } from "~/environmentApi";

export const projectQueryKeys = {
  all: ["projects"] as const,
  searchEntries: (
    environmentId: EnvironmentId | null,
    cwd: string | null,
    query: string,
    limit: number,
  ) => ["projects", "search-entries", environmentId ?? null, cwd, query, limit] as const,
  listWorkspaceEntries: (environmentId: EnvironmentId | null, cwd: string | null, limit: number) =>
    ["projects", "list-workspace-entries", environmentId ?? null, cwd, limit] as const,
  readWorkspaceFile: (
    environmentId: EnvironmentId | null,
    cwd: string | null,
    relativePath: string | null,
  ) => ["projects", "read-workspace-file", environmentId ?? null, cwd, relativePath] as const,
};

const DEFAULT_SEARCH_ENTRIES_LIMIT = 80;
const DEFAULT_SEARCH_ENTRIES_STALE_TIME = 15_000;
const EMPTY_SEARCH_ENTRIES_RESULT: ProjectSearchEntriesResult = {
  entries: [],
  truncated: false,
};

export function projectListWorkspaceEntriesQueryOptions(input: {
  environmentId: EnvironmentId | null;
  cwd: string | null;
  enabled?: boolean;
  limit?: number;
  staleTime?: number;
}) {
  const limit = input.limit ?? 200;
  return queryOptions({
    queryKey: projectQueryKeys.listWorkspaceEntries(input.environmentId, input.cwd, limit),
    queryFn: async () => {
      if (!input.cwd || !input.environmentId) {
        throw new Error("Workspace file list is unavailable.");
      }
      const api = ensureEnvironmentApi(input.environmentId);
      const body: ProjectListWorkspaceEntriesInput = { cwd: input.cwd, limit };
      return api.projects.listWorkspaceEntries(body);
    },
    enabled:
      (input.enabled ?? true) && input.environmentId !== null && input.cwd !== null && input.cwd.length > 0,
    staleTime: input.staleTime ?? DEFAULT_SEARCH_ENTRIES_STALE_TIME,
    placeholderData: (previous) => previous ?? EMPTY_SEARCH_ENTRIES_RESULT,
  });
}

const READ_WORKSPACE_FILE_TIMEOUT_MS = 45_000;

function withAbortableTimeout<T>(
  promise: Promise<T>,
  ms: number,
  abortSignal: AbortSignal | undefined,
): Promise<T> {
  if (abortSignal?.aborted) {
    return Promise.reject(abortSignal.reason);
  }
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(
        new Error(
          `Timed out after ${Math.round(ms / 1000)}s waiting for workspace file preview.`,
        ),
      );
    }, ms);

    const onAbort = () => {
      window.clearTimeout(timer);
      reject(abortSignal?.reason ?? new DOMException("Aborted", "AbortError"));
    };
    abortSignal?.addEventListener("abort", onAbort);

    void promise.then(
      (value) => {
        window.clearTimeout(timer);
        abortSignal?.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        abortSignal?.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

export function projectReadWorkspaceFileQueryOptions(input: {
  readonly environmentId: EnvironmentId | null;
  readonly cwd: string | null;
  readonly relativePath: string | null;
  readonly enabled?: boolean;
  readonly staleTime?: number;
}) {
  return queryOptions({
    queryKey: projectQueryKeys.readWorkspaceFile(
      input.environmentId,
      input.cwd,
      input.relativePath,
    ),
    queryFn: async ({ signal }) => {
      if (!input.cwd || !input.environmentId || !input.relativePath) {
        throw new Error("Workspace file preview is unavailable.");
      }
      const api = ensureEnvironmentApi(input.environmentId);
      const body: ProjectReadWorkspaceFileInput = {
        cwd: input.cwd,
        relativePath: input.relativePath,
      };
      try {
        return await withAbortableTimeout(
          api.projects.readWorkspaceFile(body),
          READ_WORKSPACE_FILE_TIMEOUT_MS,
          signal,
        );
      } catch (error) {
        console.error("[flowstarter] projects.readWorkspaceFile RPC failed", {
          environmentId: input.environmentId,
          cwd: input.cwd,
          relativePath: input.relativePath,
          error,
        });
        throw error;
      }
    },
    enabled:
      (input.enabled ?? true) &&
      input.environmentId !== null &&
      input.cwd !== null &&
      input.cwd.length > 0 &&
      input.relativePath !== null &&
      input.relativePath.length > 0,
    staleTime: input.staleTime ?? 5_000,
  });
}

export function projectSearchEntriesQueryOptions(input: {
  environmentId: EnvironmentId | null;
  cwd: string | null;
  query: string;
  enabled?: boolean;
  limit?: number;
  staleTime?: number;
}) {
  const limit = input.limit ?? DEFAULT_SEARCH_ENTRIES_LIMIT;
  return queryOptions({
    queryKey: projectQueryKeys.searchEntries(input.environmentId, input.cwd, input.query, limit),
    queryFn: async () => {
      if (!input.cwd || !input.environmentId) {
        throw new Error("Workspace entry search is unavailable.");
      }
      const api = ensureEnvironmentApi(input.environmentId);
      return api.projects.searchEntries({
        cwd: input.cwd,
        query: input.query,
        limit,
      });
    },
    enabled:
      (input.enabled ?? true) &&
      input.environmentId !== null &&
      input.cwd !== null &&
      input.query.length > 0,
    staleTime: input.staleTime ?? DEFAULT_SEARCH_ENTRIES_STALE_TIME,
    placeholderData: (previous) => previous ?? EMPTY_SEARCH_ENTRIES_RESULT,
  });
}
