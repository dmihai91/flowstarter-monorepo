import type { EnvironmentId, EnvironmentApi } from "@flowstarter/editor-contracts";

import type { WsRpcClient } from "./rpc/wsRpcClient";
import { readEnvironmentConnection } from "./environments/runtime";

export type WorkspaceFilesRpcRouteKind = "draft" | "server";

export function createEnvironmentApi(rpcClient: WsRpcClient): EnvironmentApi {
  return {
    terminal: {
      open: (input) => rpcClient.terminal.open(input as never),
      write: (input) => rpcClient.terminal.write(input as never),
      resize: (input) => rpcClient.terminal.resize(input as never),
      clear: (input) => rpcClient.terminal.clear(input as never),
      restart: (input) => rpcClient.terminal.restart(input as never),
      close: (input) => rpcClient.terminal.close(input as never),
      onEvent: (callback) => rpcClient.terminal.onEvent(callback),
    },
    projects: {
      searchEntries: rpcClient.projects.searchEntries,
      listWorkspaceEntries: rpcClient.projects.listWorkspaceEntries,
      readWorkspaceFile: rpcClient.projects.readWorkspaceFile,
      writeFile: rpcClient.projects.writeFile,
    },
    git: {
      pull: rpcClient.git.pull,
      refreshStatus: rpcClient.git.refreshStatus,
      onStatus: (input, callback, options) => rpcClient.git.onStatus(input, callback, options),
      listBranches: rpcClient.git.listBranches,
      createWorktree: rpcClient.git.createWorktree,
      removeWorktree: rpcClient.git.removeWorktree,
      createBranch: rpcClient.git.createBranch,
      checkout: rpcClient.git.checkout,
      init: rpcClient.git.init,
      resolvePullRequest: rpcClient.git.resolvePullRequest,
      preparePullRequestThread: rpcClient.git.preparePullRequestThread,
    },
    orchestration: {
      getSnapshot: rpcClient.orchestration.getSnapshot,
      dispatchCommand: rpcClient.orchestration.dispatchCommand,
      getTurnDiff: rpcClient.orchestration.getTurnDiff,
      getFullThreadDiff: rpcClient.orchestration.getFullThreadDiff,
      replayEvents: (fromSequenceExclusive) =>
        rpcClient.orchestration
          .replayEvents({ fromSequenceExclusive })
          .then((events) => [...events]),
      onDomainEvent: (callback, options) =>
        rpcClient.orchestration.onDomainEvent(callback, options),
    },
  };
}

export function readEnvironmentApi(environmentId: EnvironmentId): EnvironmentApi | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  if (!environmentId) {
    return undefined;
  }

  const connection = readEnvironmentConnection(environmentId);
  return connection ? createEnvironmentApi(connection.client) : undefined;
}

/**
 * File-browser RPC (`listWorkspaceEntries`, `readWorkspaceFile`) requires an active
 * `WsRpcClient` registered for {@link EnvironmentId}. Draft threads occasionally retain a
 * {@link EnvironmentId} that does not match the primary websocket registration (descriptor /
 * bootstrap timing). When the thread id has **no** registered API but the **primary**
 * connection is live — typical single-workspace dev — fall through so Files preview/list RPC
 * still routes correctly on `/draft/...`.
 */
export function resolveRegisteredWorkspaceRpcEnvironmentId(input: {
  readonly threadEnvironmentId: EnvironmentId;
  readonly primaryEnvironmentId: EnvironmentId | null;
  readonly routeKind: WorkspaceFilesRpcRouteKind;
  readonly activeProjectEnvironmentId: EnvironmentId | undefined;
}): EnvironmentId {
  if (typeof window === "undefined") {
    return input.threadEnvironmentId;
  }
  if (readEnvironmentApi(input.threadEnvironmentId)) {
    return input.threadEnvironmentId;
  }

  const primary = input.primaryEnvironmentId;
  if (!primary || !readEnvironmentApi(primary)) {
    return input.threadEnvironmentId;
  }

  if (input.routeKind === "draft") {
    return primary;
  }

  const projectEnv = input.activeProjectEnvironmentId;
  if (projectEnv !== undefined && projectEnv === primary) {
    return primary;
  }

  return input.threadEnvironmentId;
}

export function ensureEnvironmentApi(environmentId: EnvironmentId): EnvironmentApi {
  const api = readEnvironmentApi(environmentId);
  if (!api) {
    throw new Error(`Environment API not found for environment ${environmentId}`);
  }
  return api;
}
