import { cache } from "react";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { Role } from "@/lib/generated/prisma/client";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "@/lib/session";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  role: Role;
  mustChangePassword: boolean;
};

export function isSuperadmin(user: Pick<CurrentUser, "role">) {
  return user.role === "SUPERADMIN";
}

/** Quem pode editar um evento: o criador ou um superadmin. */
export function canManage(user: Pick<CurrentUser, "id" | "role">, event: { createdById: string }) {
  return isSuperadmin(user) || event.createdById === user.id;
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function startSession(user: { id: string; mustChangePassword: boolean }) {
  const token = await signSession({ sub: user.id, mcp: user.mustChangePassword });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Usuário logado e ativo, lido do banco (uma vez por request). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      name: true,
      email: true,
      whatsapp: true,
      role: true,
      mustChangePassword: true,
      active: true,
    },
  });
  if (!user || !user.active) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
});

/** Aceita só caminhos internos ("/eventos/x"), nunca URLs externas. */
export function safeNext(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

export function withNext(path: string, next: string | null | undefined) {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}

/**
 * Para páginas: redireciona se não estiver logado, se precisar trocar a senha,
 * se faltar completar o cadastro (WhatsApp) ou se não for superadmin quando exigido.
 * `next` é para onde voltar depois desses passos.
 */
export async function requireUser(
  options: { superadmin?: boolean; next?: string } = {},
): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sair"); // limpa o cookie (usuário removido/desativado) e vai para o login
  if (user.mustChangePassword) redirect(withNext("/trocar-senha", options.next));
  if (!user.whatsapp) redirect(withNext("/completar-cadastro", options.next));
  if (options.superadmin && !isSuperadmin(user)) redirect("/");
  return user;
}

export class AuthError extends Error {}

/** Para server actions: lança erro em vez de redirecionar. */
export async function requireAuth(options: { superadmin?: boolean } = {}): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword) throw new AuthError("Faça login novamente.");
  if (options.superadmin && !isSuperadmin(user)) {
    throw new AuthError("Você não tem permissão para isso.");
  }
  return user;
}

/** Para server actions: exige ser o criador do evento ou superadmin. */
export async function requireManager(sessionId: string) {
  const user = await requireAuth();
  const event = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!event) throw new AuthError("Evento não encontrado.");
  if (!canManage(user, event)) throw new AuthError("Só quem criou o evento pode fazer isso.");
  return { user, event };
}
