import { NextRequest, NextResponse } from "next/server";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";

function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/support") ||
    pathname.startsWith("/settings")
  );
}

const allowedDuringMaintenance = [
  "/maintenance",
  "/auth",
  "/api/auth",
  "/api/admin",
  "/admin",
  "/api/public/maintenance",
  "/_next",
  "/favicon.ico",
];

export async function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // ✅ Allow essential routes always
  const allowed = allowedDuringMaintenance.some((path) =>
    pathname.startsWith(path)
  );

  if (!allowed) {
    try {
      const response = await fetch(`${origin}/api/public/maintenance`, {
        cache: "no-store",
      });

      const data = (await response.json()) as { enabled?: boolean };

      if (data.enabled) {
        return NextResponse.redirect(new URL("/maintenance", request.url));
      }
    } catch {
      // fail silently
    }
  }

  // ✅ Existing auth logic (unchanged)
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? parseSessionValue(sessionCookie) : null;

  if (!session) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!session.onboardingCompleted && pathname !== "/auth/complete-profile") {
    return NextResponse.redirect(new URL("/auth/complete-profile", request.url));
  }

  if (
    pathname.startsWith("/admin") &&
    session.role !== "ADMIN" &&
    session.role !== "SUPPORT"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!.*\\..*).*)", // apply globally (needed for maintenance)
  ],
};