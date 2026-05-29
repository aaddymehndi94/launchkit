import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./DashboardPage";

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

const api = vi.hoisted(() => ({
  createProfilePhotoUpload: vi.fn(),
  deleteProfilePhoto: vi.fn(),
  getMe: vi.fn(),
  getProfilePhoto: vi.fn(),
  listFiles: vi.fn(),
  saveProfilePhoto: vi.fn(),
  updateMe: vi.fn()
}));

vi.mock("../lib/api-context", () => ({
  useApi: () => api
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getMe.mockResolvedValue(profile);
    api.getProfilePhoto.mockResolvedValue({
      imageUrl: null,
      expiresInSeconds: null,
      contentType: null
    });
    api.listFiles.mockResolvedValue([]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
  });

  it("renders an empty profile photo state", async () => {
    renderWithClient(<DashboardPage />);

    expect(await screen.findByText("Profile photo")).toBeInTheDocument();
    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(screen.getByText("Upload photo")).toBeInTheDocument();
  });

  it("uploads a profile photo from the dashboard", async () => {
    api.createProfilePhotoUpload.mockResolvedValue({
      key: "local/profile/photo.png",
      uploadUrl: "http://localhost/upload",
      method: "PUT",
      headers: { "content-type": "image/png" }
    });
    api.saveProfilePhoto.mockResolvedValue({
      ...profile,
      profilePhotoKey: "local/profile/photo.png",
      profilePhotoContentType: "image/png",
      profilePhotoSizeBytes: 1024,
      profilePhotoUpdatedAt: "2026-01-01T00:00:00.000Z"
    });

    renderWithClient(<DashboardPage />);

    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    fireEvent.change(await screen.findByLabelText("Upload photo"), {
      target: { files: [file] }
    });

    await waitFor(() => {
      expect(api.createProfilePhotoUpload).toHaveBeenCalledWith({
        filename: "avatar.png",
        contentType: "image/png",
        sizeBytes: file.size
      });
    });
    expect(api.saveProfilePhoto).toHaveBeenCalledWith({
      key: "local/profile/photo.png",
      contentType: "image/png",
      sizeBytes: file.size
    });
  });
});

function renderWithClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}
