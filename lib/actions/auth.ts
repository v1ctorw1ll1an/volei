"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { type ActionResult, toActionError, UserError } from "@/lib/action-result";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("E-mail inválido.")),
  password: z.string().min(1, "Informe a senha."),
});

export async function login(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  let mustChange: boolean;
  try {
    const data = loginSchema.parse(Object.fromEntries(formData));
    const user = await db.user.findUnique({ where: { email: data.email } });
    const ok = user && user.active && (await verifyPassword(data.password, user.passwordHash));
    if (!ok) throw new UserError("E-mail ou senha incorretos.");
    await startSession(user);
    mustChange = user.mustChangePassword;
  } catch (e) {
    return toActionError(e);
  }
  redirect(mustChange ? "/trocar-senha" : "/");
}

const MIN_PASSWORD = 6;

const changeSchema = z
  .object({
    current: z.string().min(1, "Informe a senha atual."),
    password: z.string().min(MIN_PASSWORD, `A nova senha precisa de ao menos ${MIN_PASSWORD} caracteres.`),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "As senhas não conferem." })
  .refine((d) => d.password !== d.current, { message: "A nova senha deve ser diferente da atual." });

export async function changePassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const me = await getCurrentUser();
    if (!me) throw new UserError("Faça login novamente.");
    const data = changeSchema.parse(Object.fromEntries(formData));
    const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
    if (!(await verifyPassword(data.current, user.passwordHash))) {
      throw new UserError("Senha atual incorreta.");
    }
    await db.user.update({
      where: { id: me.id },
      data: { passwordHash: await hashPassword(data.password), mustChangePassword: false },
    });
    await startSession({ id: me.id, mustChangePassword: false });
  } catch (e) {
    return toActionError(e);
  }
  redirect("/");
}
