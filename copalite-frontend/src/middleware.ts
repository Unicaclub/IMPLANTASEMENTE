import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/auth/login", "/auth/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths, static files, and API routes
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // Check for access token in localStorage is not possible server-side,
  // but we can check the refresh cookie set by the backend
  const refreshToken = request.cookies.get("copalite_refresh")?.value;
  const hasToken = !!refreshToken;

  if (!hasToken) {
    const loginUrl = new URL("/auth/login", request.url);
    // Sanitize redirect param — only allow safe relative paths
    const isSafe = pathname.startsWith("/")
      && !pathname.startsWith("//")
      && !pathname.includes("..")
      && !pathname.includes("\\")
      && !/^\/+[a-zA-Z]:/.test(pathname);
    if (isSafe) {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.svg|public/).*)"],
};
