import type {
  AdminMetrics,
  FileDownloadResponse,
  FileRecord,
  PresignUploadInput,
  PresignUploadResponse,
  Profile,
  UpdateProfileInput,
  UserRole
} from "@launchkit/contracts";
import type { AppUser } from "./auth";
import type { RuntimeConfig } from "./runtime-config";

type ApiEnvelope<T> = {
  data: T;
  requestId: string;
};

type ApiErrorEnvelope = {
  error: {
    code: string;
    message: string;
  };
  requestId: string;
};

export type ApiClient = ReturnType<typeof createApiClient>;

export function createApiClient(
  config: RuntimeConfig,
  getAccessToken: () => Promise<string | null>,
  getLocalUser: () => AppUser | null
) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has("content-type") && init.body) {
      headers.set("content-type", "application/json");
    }

    const token = await getAccessToken();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    if (config.authMode === "local") {
      const user = getLocalUser();
      if (user) {
        headers.set("x-launchkit-user-id", user.id);
        headers.set("x-launchkit-email", user.email);
        headers.set("x-launchkit-role", user.role);
      }
    }

    const response = await fetch(new URL(path, config.apiUrl), {
      ...init,
      headers
    });

    const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | ApiErrorEnvelope | null;

    if (!response.ok) {
      const message = body && "error" in body ? body.error.message : `Request failed: ${response.status}`;
      throw new Error(message);
    }

    if (!body || !("data" in body)) {
      throw new Error("API response did not include a data envelope.");
    }

    return body.data;
  }

  return {
    getMe: () => request<Profile>("/me"),
    updateMe: (input: UpdateProfileInput) =>
      request<Profile>("/me", {
        method: "PUT",
        body: JSON.stringify(input)
      }),
    listFiles: () => request<FileRecord[]>("/files"),
    createUpload: (input: PresignUploadInput) =>
      request<PresignUploadResponse>("/files/presign", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    getFileDownload: (id: string) => request<FileDownloadResponse>(`/files/${id}/download`),
    deleteFile: (id: string) =>
      request<FileRecord>(`/files/${id}`, {
        method: "DELETE"
      }),
    listUsers: () => request<Profile[]>("/admin/users"),
    updateUserRole: (id: string, role: UserRole) =>
      request<Profile>(`/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role })
      }),
    getAdminMetrics: () => request<AdminMetrics>("/admin/metrics")
  };
}
