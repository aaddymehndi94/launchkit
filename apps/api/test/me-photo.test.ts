import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";

const profile = {
  id: "00000000-0000-4000-8000-000000000001",
  cognitoSubject: "local-user",
  email: "user@example.com",
  displayName: "Local User",
  role: "user",
  profilePhotoKey: null,
  profilePhotoContentType: null,
  profilePhotoSizeBytes: null,
  profilePhotoUpdatedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
} as const;

const dbMocks = vi.hoisted(() => ({
  clearProfilePhoto: vi.fn(),
  createFileRecord: vi.fn(),
  ensureProfileForAuth: vi.fn(),
  getDb: vi.fn(),
  getFileStats: vi.fn(),
  getOwnedFile: vi.fn(),
  listFilesForProfile: vi.fn(),
  listProfiles: vi.fn(),
  setProfilePhoto: vi.fn(),
  setProfileRole: vi.fn(),
  softDeleteOwnedFile: vi.fn(),
  updateProfile: vi.fn(),
  writeAudit: vi.fn()
}));

const storageMocks = vi.hoisted(() => ({
  buildObjectKey: vi.fn(),
  buildProfilePhotoKey: vi.fn(),
  createDownloadTarget: vi.fn(),
  createInlineViewTarget: vi.fn(),
  createUploadTarget: vi.fn(),
  deleteStoredObject: vi.fn(),
  isProfileOwnedObjectKey: vi.fn()
}));

vi.mock("@launchkit/db", () => dbMocks);
vi.mock("../src/services/storage.js", () => storageMocks);

describe("profile photo routes", () => {
  beforeEach(() => {
    process.env.AUTH_MODE = "local";
    delete process.env.APP_SECRET_ARN;
    delete process.env.APP_SECRET_NAME;
    vi.clearAllMocks();
    dbMocks.getDb.mockReturnValue({});
    dbMocks.ensureProfileForAuth.mockResolvedValue(profile);
    storageMocks.buildProfilePhotoKey.mockReturnValue("local/profile/photo.png");
    storageMocks.createUploadTarget.mockResolvedValue({
      uploadUrl: "http://localhost/upload",
      method: "PUT",
      headers: { "content-type": "image/png" }
    });
    storageMocks.createInlineViewTarget.mockResolvedValue({
      downloadUrl: "http://localhost/photo",
      expiresInSeconds: 300
    });
    storageMocks.isProfileOwnedObjectKey.mockReturnValue(true);
  });

  it("presigns profile photo uploads", async () => {
    const response = await createApp().request("/me/photo/presign", {
      method: "POST",
      body: JSON.stringify({
        filename: "avatar.png",
        contentType: "image/png",
        sizeBytes: 1024
      }),
      headers: { "content-type": "application/json" }
    });
    const body = (await response.json()) as { data: { key: string; uploadUrl: string } };

    expect(response.status).toBe(201);
    expect(body.data.key).toBe("local/profile/photo.png");
    expect(body.data.uploadUrl).toBe("http://localhost/upload");
  });

  it("saves profile photo metadata and deletes the previous object", async () => {
    dbMocks.setProfilePhoto.mockResolvedValue({
      profile: { ...profile, profilePhotoKey: "local/profile/photo.png" },
      previousPhotoKey: "local/profile/old.png"
    });

    const response = await createApp().request("/me/photo", {
      method: "PUT",
      body: JSON.stringify({
        key: "local/profile/photo.png",
        contentType: "image/png",
        sizeBytes: 1024
      }),
      headers: { "content-type": "application/json" }
    });

    expect(response.status).toBe(200);
    expect(dbMocks.setProfilePhoto).toHaveBeenCalledWith({}, profile.id, {
      key: "local/profile/photo.png",
      contentType: "image/png",
      sizeBytes: 1024
    });
    expect(storageMocks.deleteStoredObject).toHaveBeenCalledWith("local/profile/old.png");
  });

  it("rejects photo metadata for keys outside the profile photo scope", async () => {
    storageMocks.isProfileOwnedObjectKey.mockReturnValue(false);

    const response = await createApp().request("/me/photo", {
      method: "PUT",
      body: JSON.stringify({
        key: "local/profile/files/not-a-photo.png",
        contentType: "image/png",
        sizeBytes: 1024
      }),
      headers: { "content-type": "application/json" }
    });

    expect(response.status).toBe(400);
    expect(dbMocks.setProfilePhoto).not.toHaveBeenCalled();
  });

  it("returns an inline profile photo URL when a photo exists", async () => {
    dbMocks.ensureProfileForAuth.mockResolvedValue({
      ...profile,
      profilePhotoKey: "local/profile/photo.png",
      profilePhotoContentType: "image/png"
    });

    const response = await createApp().request("/me/photo");
    const body = (await response.json()) as { data: { imageUrl: string | null } };

    expect(response.status).toBe(200);
    expect(body.data.imageUrl).toBe("http://localhost/photo");
    expect(storageMocks.createInlineViewTarget).toHaveBeenCalledWith("local/profile/photo.png", "image/png");
  });

  it("clears the profile photo", async () => {
    dbMocks.clearProfilePhoto.mockResolvedValue({
      profile,
      previousPhotoKey: "local/profile/photo.png"
    });

    const response = await createApp().request("/me/photo", {
      method: "DELETE"
    });

    expect(response.status).toBe(200);
    expect(dbMocks.clearProfilePhoto).toHaveBeenCalledWith({}, profile.id);
    expect(storageMocks.deleteStoredObject).toHaveBeenCalledWith("local/profile/photo.png");
  });
});
