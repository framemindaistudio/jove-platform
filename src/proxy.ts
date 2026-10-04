import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/hq/session";

/**
 * Two websites, one deployment:
 *   • public site  → everything except /hq
 *   • JOVE HQ      → /hq/*  (and hq.<your-domain> if you add that domain in Vercel)
 * Every HQ page and API call requires a valid signed session cookie.
 * (Pages and APIs re-check the session server-side as well.)
 */
const PUBLIC_HQ_PATHS = ["/hq/login", "/api/hq/auth/login", "/api/hq/auth/logout"];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = req.headers.get("host") || "";

  // hq.<domain> → serve the portal at its root
  if (host.startsWith("hq.") && !pathname.startsWith("/hq") && !pathname.startsWith("/api") && !pathname.startsWith("/_next") && !/\.[a-z0-9]+$/i.test(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = `/hq${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const isHq = pathname === "/hq" || pathname.startsWith("/hq/");
  const isHqApi = pathname.startsWith("/api/hq/");
  if (!isHq && !isHqApi) return NextResponse.next();
  if (PUBLIC_HQ_PATHS.some((p) => pathname === p)) return NextResponse.next();

  const user = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (user) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }

  if (isHqApi) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/hq/login";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|brand/|videos/|icon|apple-icon|opengraph-image).*)"],
};
