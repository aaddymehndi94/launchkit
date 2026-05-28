import { describe, expect, it } from "vitest";
import { files, profiles } from "../src/index.js";

describe("database schema", () => {
  it("exports the launch kit base tables", () => {
    expect(profiles).toBeDefined();
    expect(files).toBeDefined();
  });
});
