import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Checagem otimista (só o cookie). A checagem real, com o banco, é feita
// nas páginas (requireUser) e em cada server action (requireRole).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/sair") return NextResponse.next();
  if (pathname === "/login") {
    return session ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (session.mcp && pathname !== "/trocar-senha") {
    return NextResponse.redirect(new URL("/trocar-senha", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
