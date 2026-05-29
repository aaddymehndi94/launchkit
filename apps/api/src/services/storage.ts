import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { readEnv, readOptionalEnv } from "@launchkit/core";

const s3 = new S3Client({});

export type UploadTarget = {
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
};

export type DownloadTarget = {
  downloadUrl: string;
  expiresInSeconds: number;
};

export function buildObjectKey(profileId: string, filename: string): string {
  return buildScopedObjectKey(profileId, "files", filename);
}

export function buildProfilePhotoKey(profileId: string, filename: string): string {
  return buildScopedObjectKey(profileId, "profile-photo", filename);
}

export function isProfileOwnedObjectKey(profileId: string, key: string): boolean {
  return key.startsWith(`${readEnv("STAGE", "local")}/${profileId}/profile-photo/`);
}

function buildScopedObjectKey(profileId: string, scope: string, filename: string): string {
  const safeName = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return `${readEnv("STAGE", "local")}/${profileId}/${scope}/${crypto.randomUUID()}-${safeName || "upload"}`;
}

export async function createUploadTarget(key: string, contentType: string): Promise<UploadTarget> {
  const bucket = readOptionalEnv("UPLOAD_BUCKET_NAME");
  const headers = { "content-type": contentType };

  if (!bucket) {
    const baseUrl = readEnv("PUBLIC_API_URL", `http://localhost:${readEnv("API_PORT", "4000")}`);
    const url = new URL("/local-upload", baseUrl);
    url.searchParams.set("key", key);

    return {
      uploadUrl: url.toString(),
      method: "PUT",
      headers
    };
  }

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType
    }),
    { expiresIn: 300 }
  );

  return {
    uploadUrl,
    method: "PUT",
    headers
  };
}

export async function createDownloadTarget(
  key: string,
  filename: string,
  contentType: string
): Promise<DownloadTarget> {
  const expiresInSeconds = 300;
  const bucket = readOptionalEnv("UPLOAD_BUCKET_NAME");

  if (!bucket) {
    const baseUrl = readEnv("PUBLIC_API_URL", `http://localhost:${readEnv("API_PORT", "4000")}`);
    const url = new URL("/local-upload", baseUrl);
    url.searchParams.set("key", key);
    url.searchParams.set("filename", filename);
    url.searchParams.set("contentType", contentType);

    return {
      downloadUrl: url.toString(),
      expiresInSeconds
    };
  }

  const downloadUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename.replaceAll('"', "")}"`,
      ResponseContentType: contentType
    }),
    { expiresIn: expiresInSeconds }
  );

  return {
    downloadUrl,
    expiresInSeconds
  };
}

export async function createInlineViewTarget(key: string, contentType: string): Promise<DownloadTarget> {
  const expiresInSeconds = 300;
  const bucket = readOptionalEnv("UPLOAD_BUCKET_NAME");

  if (!bucket) {
    const baseUrl = readEnv("PUBLIC_API_URL", `http://localhost:${readEnv("API_PORT", "4000")}`);
    const url = new URL("/local-upload", baseUrl);
    url.searchParams.set("key", key);
    url.searchParams.set("filename", "profile-photo");
    url.searchParams.set("contentType", contentType);
    url.searchParams.set("disposition", "inline");

    return {
      downloadUrl: url.toString(),
      expiresInSeconds
    };
  }

  const downloadUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: "inline",
      ResponseContentType: contentType
    }),
    { expiresIn: expiresInSeconds }
  );

  return {
    downloadUrl,
    expiresInSeconds
  };
}

export async function deleteStoredObject(key: string): Promise<void> {
  const bucket = readOptionalEnv("UPLOAD_BUCKET_NAME");
  if (!bucket) {
    return;
  }

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    })
  );
}
