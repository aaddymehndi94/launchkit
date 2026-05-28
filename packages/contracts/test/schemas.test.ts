import { describe, expect, it } from "vitest";
import { presignUploadRequestSchema } from "../src/index.js";

describe("upload contract", () => {
  it("rejects files above the default starter limit", () => {
    const result = presignUploadRequestSchema.safeParse({
      filename: "large.mov",
      contentType: "video/quicktime",
      sizeBytes: 30 * 1024 * 1024
    });

    expect(result.success).toBe(false);
  });
});
