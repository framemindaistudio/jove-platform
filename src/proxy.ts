import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/hq/session";
import { EDITORS, VIEW_ONLY_MESSAGE } from "@/lib/hq/roles";
import { liveUser } from "@/lib/hq/users";

/**
 * Two websites, one deployment:
 *   • public site  → everything except /hq
 *   • JOVE HQ      → /hq/*  (and hq.<your-domain> if you add that domain in Vercel)
 * Every HQ page and API call requires a valid signed session cookie for an account that still exists.
 * Only editors (founders) may call an HQ API with anything but a read; everyone else can view and print.
 * (Pages and APIs re-check both server-side as well.)
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

  const user = await liveUser(await verifySession(req.cookies.get(SESSION_COOKIE)?.value));
  if (user) {
    if (isHqApi && !["GET", "HEAD", "OPTIONS"].includes(req.method) && !EDITORS.includes(user.role)) {
      return NextResponse.json({ error: VIEW_ONLY_MESSAGE, viewOnly: true }, { status: 403 });
    }
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
