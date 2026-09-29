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
  role: Role;
  mustChangePassword: boolean;
};

const RANK: Record<Role, number> = { MEMBER: 0, ADMIN: 1, SUPERADMIN: 2 };

export function hasRole(user: Pick<CurrentUser, "role">, role: Role) {
  return RANK[user.role] >= RANK[role];
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

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Usuário logado e ativo, lido do banco (uma vez por request). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, mustChangePassword: true, active: true },
  });
  if (!user || !user.active) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
});

/** Para páginas: redireciona se não estiver logado, se precisar trocar a senha ou sem papel. */
export async function requireUser(role: Role = "MEMBER"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sair"); // limpa o cookie (usuário removido/desativado) e vai para o login
  if (user.mustChangePassword) redirect("/trocar-senha");
  if (!hasRole(user, role)) redirect("/");
  return user;
}

export class AuthError extends Error {}

/** Para server actions: lança erro em vez de redirecionar. */
export async function requireRole(role: Role = "MEMBER"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword) throw new AuthError("Faça login novamente.");
  if (!hasRole(user, role)) throw new AuthError("Você não tem permissão para isso.");
  return user;
}
