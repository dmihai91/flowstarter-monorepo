import fsPromises from "node:fs/promises";

import { Effect, FileSystem, Layer, Path } from "effect";

import {
  WorkspaceFileSystem,
  WorkspaceFileSystemError,
  type WorkspaceFileSystemShape,
} from "../Services/WorkspaceFileSystem.ts";
import { WorkspaceEntries } from "../Services/WorkspaceEntries.ts";
import { WorkspacePaths } from "../Services/WorkspacePaths.ts";

const WORKSPACE_FILE_PREVIEW_MAX_BYTES = 512 * 1024;

export const makeWorkspaceFileSystem = Effect.gen(function* () {
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const workspacePaths = yield* WorkspacePaths;
  const workspaceEntries = yield* WorkspaceEntries;

  const writeFile: WorkspaceFileSystemShape["writeFile"] = Effect.fn(
    "WorkspaceFileSystem.writeFile",
  )(function* (input) {
    const target = yield* workspacePaths.resolveRelativePathWithinRoot({
      workspaceRoot: input.cwd,
      relativePath: input.relativePath,
    });

    yield* fileSystem.makeDirectory(path.dirname(target.absolutePath), { recursive: true }).pipe(
      Effect.mapError(
        (cause) =>
          new WorkspaceFileSystemError({
            cwd: input.cwd,
            relativePath: input.relativePath,
            operation: "workspaceFileSystem.makeDirectory",
            detail: cause.message,
            cause,
          }),
      ),
    );
    yield* fileSystem.writeFileString(target.absolutePath, input.contents).pipe(
      Effect.mapError(
        (cause) =>
          new WorkspaceFileSystemError({
            cwd: input.cwd,
            relativePath: input.relativePath,
            operation: "workspaceFileSystem.writeFile",
            detail: cause.message,
            cause,
          }),
      ),
    );
    yield* workspaceEntries.invalidate(input.cwd);
    return { relativePath: target.relativePath };
  });

  const readWorkspaceFile: WorkspaceFileSystemShape["readWorkspaceFile"] = Effect.fn(
    "WorkspaceFileSystem.readWorkspaceFile",
  )(function* (input) {
    const target = yield* workspacePaths.resolveRelativePathWithinRoot({
      workspaceRoot: input.cwd,
      relativePath: input.relativePath,
    });

    const outcome = yield* Effect.tryPromise({
      try: async () => {
        const st = await fsPromises.stat(target.absolutePath);
        if (!st.isFile()) {
          return { tag: "not_file" as const };
        }

        const rawSize = st.size;
        const size = typeof rawSize === "bigint" ? Number(rawSize) : rawSize;

        const truncated = size > WORKSPACE_FILE_PREVIEW_MAX_BYTES;
        const readLen = Math.min(Math.max(size, 0), WORKSPACE_FILE_PREVIEW_MAX_BYTES);

        if (readLen === 0) {
          return {
            tag: "text" as const,
            relativePath: target.relativePath,
            content: "",
            truncated,
          };
        }

        const fh = await fsPromises.open(target.absolutePath, "r");
        try {
          const buf = Buffer.alloc(readLen);
          let offset = 0;
          while (offset < readLen) {
            const { bytesRead } = await fh.read(buf, offset, readLen - offset, offset);
            if (bytesRead === 0) {
              break;
            }
            offset += bytesRead;
          }
          const slice = buf.subarray(0, offset);

          if (slice.indexOf(0) !== -1) {
            return {
              tag: "binary" as const,
              relativePath: target.relativePath,
              truncated,
            };
          }

          let text: string;
          try {
            text = new TextDecoder("utf-8", { fatal: true }).decode(slice);
          } catch {
            if (truncated) {
              text = new TextDecoder("utf-8", { fatal: false }).decode(slice);
            } else {
              return {
                tag: "binary" as const,
                relativePath: target.relativePath,
                truncated,
              };
            }
          }

          return {
            tag: "text" as const,
            relativePath: target.relativePath,
            content: text,
            truncated,
          };
        } finally {
          await fh.close();
        }
      },
      catch: (cause) =>
        new WorkspaceFileSystemError({
          cwd: input.cwd,
          relativePath: input.relativePath,
          operation: "workspaceFileSystem.readWorkspaceFile",
          detail: cause instanceof Error ? cause.message : String(cause),
          cause,
        }),
    });

    if (outcome.tag === "not_file") {
      return yield* new WorkspaceFileSystemError({
        cwd: input.cwd,
        relativePath: input.relativePath,
        operation: "workspaceFileSystem.readWorkspaceFile",
        detail: "Path is not a regular file.",
      });
    }

    if (outcome.tag === "binary") {
      return {
        kind: "binary" as const,
        relativePath: outcome.relativePath,
        truncated: outcome.truncated,
      };
    }

    return {
      kind: "text" as const,
      relativePath: outcome.relativePath,
      content: outcome.content,
      truncated: outcome.truncated,
    };
  });

  return { writeFile, readWorkspaceFile } satisfies WorkspaceFileSystemShape;
});

export const WorkspaceFileSystemLive = Layer.effect(WorkspaceFileSystem, makeWorkspaceFileSystem);
