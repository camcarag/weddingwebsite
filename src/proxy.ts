import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SITE_AUTH_COOKIE, isValidSiteAuthToken } from "@/lib/site-auth";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(SITE_AUTH_COOKIE)?.value;
  if (isValidSiteAuthToken(token)) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // /login itself is excluded so the password form (and its Server Action,
  // which posts to the same path) never gets caught in the redirect.
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
