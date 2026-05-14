import { useEffect, useState } from "react";

import { subscribeEnvironmentConnections } from "~/environments/runtime";

/** Bumps when the websocket RPC registry adds/removes an environment (re-render subscribers). */
export function useEnvironmentConnectionEpoch(): number {
  const [epoch, bump] = useState(0);
  useEffect(
    () => subscribeEnvironmentConnections(() => bump((value) => value + 1)),
    [],
  );
  return epoch;
}
