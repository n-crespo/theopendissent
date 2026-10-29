import { describe, expect, it } from "vitest";
import {
  EDIT_WINDOW_MS,
  getEditWindowRemainingMs,
  isWithinEditWindow,
} from "../src/utils.ts";

const MINUTE = 60 * 1000;

describe("edit window helpers", () => {
  const createdAt = 1_700_000_000_000;

  it("is 15 minutes", () => {
    expect(EDIT_WINDOW_MS).toBe(15 * MINUTE);
  });

  it("allows edits inside the window, including the exact deadline", () => {
    expect(isWithinEditWindow(createdAt, createdAt)).toBe(true);
    expect(isWithinEditWindow(createdAt, createdAt + 14 * MINUTE)).toBe(true);
    expect(isWithinEditWindow(createdAt, createdAt + EDIT_WINDOW_MS)).toBe(
      true,
    );
  });

  it("refuses edits after the window", () => {
    expect(isWithinEditWindow(createdAt, createdAt + EDIT_WINDOW_MS + 1)).toBe(
      false,
    );
    expect(isWithinEditWindow(createdAt, createdAt + 16 * MINUTE)).toBe(false);
  });

  it("reports the time remaining", () => {
    expect(getEditWindowRemainingMs(createdAt, createdAt + 5 * MINUTE)).toBe(
      10 * MINUTE,
    );
    expect(getEditWindowRemainingMs(createdAt, createdAt + 20 * MINUTE)).toBe(
      -5 * MINUTE,
    );
  });

  it("treats a pending server timestamp as just created", () => {
    const pending = { ".sv": "timestamp" };
    expect(isWithinEditWindow(pending, createdAt)).toBe(true);
    expect(getEditWindowRemainingMs(pending, createdAt)).toBe(EDIT_WINDOW_MS);
  });

  it("treats a missing timestamp as expired (rules require a number)", () => {
    expect(isWithinEditWindow(undefined, createdAt)).toBe(false);
  });
});
