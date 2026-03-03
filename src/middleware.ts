import { NextRequest, NextResponse } from "next/server";
import { authRequired } from "@/lib/api-helpers";

const AUTH_ENABLED = process.env.AUTH_ENABLED !== "false";
const AUTH_TOKEN = process.env.AUTH_TOKEN ?? "";

const BYPASS_EXACT = new Set([
  "/favicon.ico",
  "/robots.txt",
]);

function isBypassPath(pathname: string): boolean {
  if (pathname.startsWith("/_next/")) {
    return true;
  }

  if (pathname.startsWith("/static/")) {
    return true;
  }

  if (BYPASS_EXACT.has(pathname)) {
    return true;
  }

  return false;
}

function hasValidBearerToken(request: NextRequest): boolean {
  const authorization = request.headers.get("authorization");
  const expected = `Bearer ${AUTH_TOKEN}`;

  if (!authorization || !AUTH_TOKEN) {
    return false;
  }

  return authorization === expected;
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (isBypassPath(pathname)) {
    return NextResponse.next();
  }

  if (!AUTH_ENABLED) {
    return NextResponse.next();
  }

  if (!hasValidBearerToken(request)) {
    return authRequired();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
