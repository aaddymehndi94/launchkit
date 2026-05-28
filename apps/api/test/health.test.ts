import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("health route", () => {
  it("returns a public health response", async () => {
    const app = createApp();
    const response = await app.request("/health");
    const body = (await response.json()) as { data: { ok: boolean } };

    expect(response.status).toBe(200);
    expect(body.data.ok).toBe(true);
  });
});
