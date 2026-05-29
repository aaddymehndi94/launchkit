import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("health route", () => {
  it("allows local frontend origins on any localhost port", async () => {
    process.env.STAGE = "local";
    process.env.CORS_ALLOWED_ORIGINS = "http://localhost:5173";

    const app = createApp();
    const response = await app.request("/health", {
      method: "OPTIONS",
      headers: {
        origin: "http://localhost:5174",
        "access-control-request-method": "GET"
      }
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:5174");
  });

  it("returns a public health response", async () => {
    const app = createApp();
    const response = await app.request("/health");
    const body = (await response.json()) as { data: { ok: boolean } };

    expect(response.status).toBe(200);
    expect(body.data.ok).toBe(true);
  });
});
