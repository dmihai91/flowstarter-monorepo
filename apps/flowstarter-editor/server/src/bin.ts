// Must run before any module reads process.env — loads .env files (the
// editor's own + the main app's as a fallback) and maps OPENROUTER_API_KEY
// → ANTHROPIC_API_KEY + ANTHROPIC_BASE_URL.
import "./envBootstrap";

import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { Command } from "effect/unstable/cli";

import { NetService } from "@flowstarter/editor-shared/Net";
import { cli } from "./cli";
import { version } from "../package.json" with { type: "json" };

const CliRuntimeLayer = Layer.mergeAll(NodeServices.layer, NetService.layer);

Command.run(cli, { version }).pipe(
  Effect.scoped,
  Effect.provide(CliRuntimeLayer),
  NodeRuntime.runMain,
);
