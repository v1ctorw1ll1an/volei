import { headers } from "next/headers";
import { db } from "@/lib/db";
import { UserError } from "@/lib/action-result";

// Limite simples de tentativas guardado no Postgres (funciona em serverless sem Redis).

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconhecido";
}

/** Lança erro se a chave já tem `max` tentativas dentro da janela. */
export async function assertNotLimited(key: string, max: number, windowMs: number) {
  const since = new Date(Date.now() - windowMs);
  const count = await db.authAttempt.count({ where: { key, createdAt: { gte: since } } });
  if (count >= max) {
    throw new UserError("Muitas tentativas. Espere alguns minutos e tente de novo.");
  }
}

export async function recordAttempt(...keys: string[]) {
  await db.authAttempt.createMany({ data: keys.map((key) => ({ key })) });
  // Faxina: tentativas com mais de um dia não servem para nada.
  await db.authAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 86_400_000) } } });
}

export async function clearAttempts(key: string) {
  await db.authAttempt.deleteMany({ where: { key } });
}

export const MINUTE = 60_000;
