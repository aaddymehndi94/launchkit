import type { AuthContext } from "@launchkit/core";

export const testUserAuth: AuthContext = {
  subject: "test-user",
  email: "user@example.com",
  role: "user",
  groups: ["user"]
};

export const testAdminAuth: AuthContext = {
  subject: "test-admin",
  email: "admin@example.com",
  role: "admin",
  groups: ["admin"]
};

export function localAuthHeaders(auth: AuthContext): HeadersInit {
  return {
    "x-launchkit-user-id": auth.subject,
    "x-launchkit-email": auth.email,
    "x-launchkit-role": auth.role
  };
}
