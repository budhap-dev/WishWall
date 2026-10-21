import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: bounce visitors with no session cookie to sign-in
// before rendering anything. It does NOT validate the session; that happens
// in src/server/session.ts on every page and action that needs the user.
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const signInUrl = new URL("/signin", request.url);
  signInUrl.searchParams.set(
    "callbackUrl",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/dashboard"],
};
