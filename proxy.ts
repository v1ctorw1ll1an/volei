import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const PUBLIC_AUTH_PAGES = ["/login", "/cadastro"];

// Checagem otimista (só o cookie). A checagem real, com o banco, é feita
// nas páginas (requireUser) e em cada server action (requireAuth/requireManager).
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/sair") return NextResponse.next();

  // Guarda para onde a pessoa ia (ex.: link de um evento) e volta depois do login.
  const here = pathname + search;
  const redirectWithNext = (to: string) => {
    const url = new URL(to, request.url);
    if (pathname !== "/") url.searchParams.set("next", here);
    return NextResponse.redirect(url);
  };

  if (PUBLIC_AUTH_PAGES.includes(pathname)) {
    if (!session) return NextResponse.next();
    const next = request.nextUrl.searchParams.get("next");
    const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    return NextResponse.redirect(new URL(safe, request.url));
  }
  if (!session) return redirectWithNext("/login");
  if (session.mcp && pathname !== "/trocar-senha") return redirectWithNext("/trocar-senha");
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
