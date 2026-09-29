import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";

export type ActionResult = { error?: string; message?: string } | undefined;

/** Erro de regra de negócio, exibido ao usuário no formulário. */
export class UserError extends Error {}

/** Converte erros esperados em mensagem para o formulário; o resto propaga. */
export function toActionError(e: unknown): ActionResult {
  if (e instanceof AuthError || e instanceof UserError) return { error: e.message };
  if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "Dados inválidos." };
  throw e;
}
