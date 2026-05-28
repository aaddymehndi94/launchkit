import { ensureProfileForAuth, getDb } from "@launchkit/db";
import { forbidden, hasAdminRole, normalizeRole, readEnv, unauthorized } from "@launchkit/core";
import type { AuthContext, UserRole } from "@launchkit/core";
import type { MiddlewareHandler } from "hono";
import { loadAppSecrets } from "../services/secrets.js";
import type { AppEnv, JwtClaims } from "../types.js";

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  await loadAppSecrets();

  const authMode = readEnv("AUTH_MODE", "cognito");
  const auth = authMode === "local" ? readLocalAuth(c.req.raw.headers) : readCognitoAuth(c.env);

  c.set("auth", auth);

  const profile = await ensureProfileForAuth(getDb(), auth);
  c.set("profile", profile);

  await next();
};

export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const auth = c.get("auth");
  const profile = c.get("profile");

  if (!hasAdminRole(auth) && profile.role !== "admin") {
    throw forbidden("Admin access is required.");
  }

  await next();
};

function readLocalAuth(headers: Headers): AuthContext {
  const headerRole = headers.get("x-launchkit-role");
  const role = normalizeRole(headerRole);
  const fallbackSubject = role === "admin" ? "local-admin" : "local-user";

  return {
    subject: headers.get("x-launchkit-user-id") ?? fallbackSubject,
    email: headers.get("x-launchkit-email") ?? `${role}@example.com`,
    role,
    groups: role === "admin" ? ["admin"] : ["user"]
  };
}

function readCognitoAuth(env: unknown): AuthContext {
  const claims = readJwtClaims(env);
  const subject = claims.sub;
  const email = readEmailClaim(claims);

  if (!subject || !email || typeof subject !== "string" || typeof email !== "string") {
    throw unauthorized();
  }

  const groups = parseGroups(claims["cognito:groups"]);
  const role: UserRole = groups.includes("admin") ? "admin" : "user";

  return {
    subject,
    email,
    role,
    groups
  };
}

function readJwtClaims(env: unknown): JwtClaims {
  const candidate = env as {
    requestContext?: {
      authorizer?: {
        jwt?: {
          claims?: JwtClaims;
        };
      };
    };
    event?: {
      requestContext?: {
        authorizer?: {
          jwt?: {
            claims?: JwtClaims;
          };
        };
      };
    };
  };

  const claims =
    candidate.event?.requestContext?.authorizer?.jwt?.claims ??
    candidate.requestContext?.authorizer?.jwt?.claims;
  if (!claims) {
    throw unauthorized();
  }

  return claims;
}

function readEmailClaim(claims: JwtClaims): string | undefined {
  const email = claims.email;
  if (typeof email === "string" && email.includes("@")) {
    return email;
  }

  const username = claims.username ?? claims["cognito:username"];
  if (typeof username === "string" && username.includes("@")) {
    return username;
  }

  return typeof email === "string" ? email : undefined;
}

function parseGroups(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  return value
    .replace("[", "")
    .replace("]", "")
    .split(",")
    .map((group) => group.trim())
    .filter(Boolean);
}
