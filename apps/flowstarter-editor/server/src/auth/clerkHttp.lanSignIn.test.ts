import { describe, expect, it } from "vitest";

import { rewriteLoopbackClerkSignInUrlForLanDevice } from "./clerkHttp.ts";

describe("rewriteLoopbackClerkSignInUrlForLanDevice", () => {
  it("rewrites loopback sign-in host to the editor request host", () => {
    const out = rewriteLoopbackClerkSignInUrlForLanDevice(
      "http://localhost:3000/login",
      "http://192.168.1.10:5733/editor",
    );
    expect(out).toBe("http://192.168.1.10:3000/login");
  });

  it("leaves non-loopback sign-in URLs unchanged", () => {
    const base = "https://flowstarter.net/sign-in";
    expect(rewriteLoopbackClerkSignInUrlForLanDevice(base, "http://192.168.1.10:5733/")).toBe(base);
  });

  it("does not rewrite when the editor request is loopback", () => {
    const base = "http://localhost:3000/login";
    expect(rewriteLoopbackClerkSignInUrlForLanDevice(base, "http://127.0.0.1:5733/")).toBe(base);
  });
});
