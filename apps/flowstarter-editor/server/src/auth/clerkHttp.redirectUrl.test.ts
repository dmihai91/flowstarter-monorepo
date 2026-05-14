import { describe, expect, it } from "vitest";

import {
  EDITOR_CLERK_LOGIN_RETURN_HEADER,
  resolveEditorClerkLoginReturnUrl,
} from "./clerkHttp.ts";

describe("resolveEditorClerkLoginReturnUrl", () => {
  const requestUrl = "https://acme.flowstarter.net/api/clerk/me";

  it("prefers X-Editor-Return-Url when same-origin and not under /api/", () => {
    const href = resolveEditorClerkLoginReturnUrl(requestUrl, {
      [EDITOR_CLERK_LOGIN_RETURN_HEADER]:
        "https://acme.flowstarter.net/editor/projects/1",
    });
    expect(href).toBe("https://acme.flowstarter.net/editor/projects/1");
  });

  it("prefers X-Editor-Return-Url over Referer when both are usable", () => {
    const href = resolveEditorClerkLoginReturnUrl(requestUrl, {
      [EDITOR_CLERK_LOGIN_RETURN_HEADER]:
        "https://acme.flowstarter.net/editor/a",
      referer: "https://acme.flowstarter.net/editor/b",
    });
    expect(href).toBe("https://acme.flowstarter.net/editor/a");
  });

  it("rejects cross-origin X-Editor-Return-Url", () => {
    const href = resolveEditorClerkLoginReturnUrl(requestUrl, {
      [EDITOR_CLERK_LOGIN_RETURN_HEADER]: "https://evil.example/phish",
    });
    expect(href).toBe("https://acme.flowstarter.net/");
  });

  it("rejects /api/* return paths on the header", () => {
    const href = resolveEditorClerkLoginReturnUrl(requestUrl, {
      [EDITOR_CLERK_LOGIN_RETURN_HEADER]:
        "https://acme.flowstarter.net/api/clerk/me?x=1",
    });
    expect(href).toBe("https://acme.flowstarter.net/");
  });

  it("falls back to Referer when header missing or unusable", () => {
    const href = resolveEditorClerkLoginReturnUrl(requestUrl, {
      referer: "https://acme.flowstarter.net/pairing",
    });
    expect(href).toBe("https://acme.flowstarter.net/pairing");
  });

  it("skips Referer under /api/ and uses origin /", () => {
    const href = resolveEditorClerkLoginReturnUrl(requestUrl, {
      referer: "https://acme.flowstarter.net/api/other",
    });
    expect(href).toBe("https://acme.flowstarter.net/");
  });

  it("accepts loopback host alias when port and scheme match", () => {
    const localApi = "http://127.0.0.1:5733/api/clerk/me";
    const href = resolveEditorClerkLoginReturnUrl(localApi, {
      [EDITOR_CLERK_LOGIN_RETURN_HEADER]: "http://localhost:5733/editor",
    });
    expect(href).toBe("http://localhost:5733/editor");
  });
});
