import type { ServerAuthDescriptor } from "@flowstarter/editor-contracts";
import { Effect, Layer } from "effect";

import { ServerConfig } from "../../config.ts";
import { ServerAuthPolicy, type ServerAuthPolicyShape } from "../Services/ServerAuthPolicy.ts";
import { SESSION_COOKIE_NAME } from "../utils.ts";
import { isLoopbackHost, isWildcardHost } from "../../startupAccess.ts";

export const makeServerAuthPolicy = Effect.gen(function* () {
  const config = yield* ServerConfig;
  const isRemoteReachable = isWildcardHost(config.host) || !isLoopbackHost(config.host);

  const policy = isRemoteReachable ? "remote-reachable" : "loopback-browser";

  const descriptor: ServerAuthDescriptor = {
    policy,
    bootstrapMethods: ["one-time-token"],
    sessionMethods: ["browser-session-cookie", "bearer-session-token"],
    sessionCookieName: SESSION_COOKIE_NAME,
  };

  return {
    getDescriptor: () => Effect.succeed(descriptor),
  } satisfies ServerAuthPolicyShape;
});

export const ServerAuthPolicyLive = Layer.effect(ServerAuthPolicy, makeServerAuthPolicy);
