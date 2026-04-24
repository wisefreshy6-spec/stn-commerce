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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  if (
    pathname.startsWith("/support") &&
    session.role !== "ADMIN" &&
    session.role !== "SUPPORT" &&
    session.role !== "TEAM"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/support/:path*",
    "/settings/:path*",
  ],
};