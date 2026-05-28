import { describe, expect, it } from "vitest";
import { readBooleanEnv } from "../src/index.js";

describe("config helpers", () => {
  it("reads boolean environment values", () => {
    process.env.LAUNCHKIT_TEST_BOOL = "true";
    expect(readBooleanEnv("LAUNCHKIT_TEST_BOOL")).toBe(true);
  });
});
