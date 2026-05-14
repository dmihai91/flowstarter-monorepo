import { describe, expect, it } from "vitest";

import {
  PROJECT_DISPLAY_NAME_MAX_LENGTH,
  projectDisplayNameValidationError,
} from "./projectDisplayName";

describe("projectDisplayNameValidationError", () => {
  it("rejects empty and whitespace-only names", () => {
    expect(projectDisplayNameValidationError("")).toBe("Name cannot be empty.");
    expect(projectDisplayNameValidationError("   ")).toBe("Name cannot be empty.");
  });

  it("accepts a reasonable display name", () => {
    expect(projectDisplayNameValidationError(" My App ")).toBeNull();
  });

  it("rejects path separators", () => {
    expect(projectDisplayNameValidationError("a/b")).toBe(
      "Name cannot contain path separators (/ or \\).",
    );
    expect(projectDisplayNameValidationError("a\\b")).toBe(
      "Name cannot contain path separators (/ or \\).",
    );
  });

  it("rejects names over the max length", () => {
    expect(
      projectDisplayNameValidationError("x".repeat(PROJECT_DISPLAY_NAME_MAX_LENGTH + 1)),
    ).toBe(`Use at most ${PROJECT_DISPLAY_NAME_MAX_LENGTH} characters.`);
  });
});
