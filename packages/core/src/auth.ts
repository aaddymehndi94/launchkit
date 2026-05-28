export type UserRole = "user" | "admin";

export type AuthContext = {
  subject: string;
  email: string;
  role: UserRole;
  groups: string[];
};

export function hasAdminRole(auth: AuthContext): boolean {
  return auth.role === "admin" || auth.groups.includes("admin");
}

export function normalizeRole(value: unknown): UserRole {
  return value === "admin" ? "admin" : "user";
}
