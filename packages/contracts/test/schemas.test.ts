import { describe, expect, it } from "vitest";
import {
  maxProfilePhotoBytes,
  presignUploadRequestSchema,
  profilePhotoPresignRequestSchema
} from "../src/index.js";

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

describe("profile photo contract", () => {
  it("accepts starter profile photo input", () => {
    const result = profilePhotoPresignRequestSchema.safeParse({
      filename: "avatar.png",
      contentType: "image/png",
      sizeBytes: 128_000
    });

    expect(result.success).toBe(true);
  });

  it("rejects non-image profile photos and oversized images", () => {
    expect(
      profilePhotoPresignRequestSchema.safeParse({
        filename: "notes.pdf",
        contentType: "application/pdf",
        sizeBytes: 1000
      }).success
    ).toBe(false);
    expect(
      profilePhotoPresignRequestSchema.safeParse({
        filename: "huge.jpg",
        contentType: "image/jpeg",
        sizeBytes: maxProfilePhotoBytes + 1
      }).success
    ).toBe(false);
  });
});
