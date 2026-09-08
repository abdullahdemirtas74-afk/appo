import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "appo_session";

/** Soft gate: require session cookie on app shells. APIs remain source of truth. */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith("/app") || pathname.startsWith("/pro") || pathname.startsWith("/admin");
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  if (!token) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/pro/:path*", "/admin/:path*"],
};
