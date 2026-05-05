import type { UserRole } from "@prisma/client";

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;

  return getAdminEmails().includes(email.trim().toLowerCase());
}

export function resolveRoleFromEmail(email?: string | null): UserRole {
  if (isAdminEmail(email)) {
    return "ADMIN";
  }

  return "CUSTOMER";
}