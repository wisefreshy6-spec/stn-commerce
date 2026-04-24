export const USER_ROLES = {
  CUSTOMER: "CUSTOMER",
  TEAM: "TEAM",
  SUPPORT: "SUPPORT",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const PROTECTED_ROUTES = ["/dashboard", "/admin", "/support"] as const;
export const ADMIN_ONLY_ROUTES = ["/admin"] as const;