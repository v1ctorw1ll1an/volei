"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  getCurrentUser,
  hashPassword,
  requireAuth,
  safeNext,
  startSession,
  verifyPassword,
  withNext,
} from "@/lib/auth";
import { type ActionResult, toActionError, UserError } from "@/lib/action-result";
import { assertNotLimited, clearAttempts, clientIp, MINUTE, recordAttempt } from "@/lib/rate-limit";
import { emailSchema, nameSchema, passwordSchema, whatsappSchema } from "@/lib/schemas";

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha."),
});

export async function login(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const next = safeNext(formData.get("next"));
  let destination: string;
  try {
    const data = loginSchema.parse({ email: formData.get("email"), password: formData.get("password") });
    const ipKey = `login-ip:${await clientIp()}`;
    const emailKey = `login-email:${data.email}`;
    // Até 20 erros por IP e 8 por e-mail a cada 15 minutos.
    await assertNotLimited(ipKey, 20, 15 * MINUTE);
    await assertNotLimited(emailKey, 8, 15 * MINUTE);

    const user = await db.user.findUnique({ where: { email: data.email } });
    const ok = user && user.active && (await verifyPassword(data.password, user.passwordHash));
    if (!ok) {
      await recordAttempt(ipKey, emailKey);
      throw new UserError("E-mail ou senha incorretos.");
    }
    await clearAttempts(emailKey);
    await startSession(user);
    destination = user.mustChangePassword ? withNext("/trocar-senha", next) : (next ?? "/");
  } catch (e) {
    return toActionError(e);
  }
  redirect(destination);
}

const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  whatsapp: whatsappSchema,
  password: passwordSchema,
});

export async function signup(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const next = safeNext(formData.get("next"));
  try {
    // Campo invisível: gente não vê nem preenche; robôs costumam preencher.
    if (String(formData.get("website") ?? "") !== "") {
      throw new UserError("Não foi possível criar a conta.");
    }
    const ipKey = `signup-ip:${await clientIp()}`;
    await assertNotLimited(ipKey, 5, 60 * MINUTE); // até 5 contas por IP por hora

    const data = signupSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      whatsapp: formData.get("whatsapp"),
      password: formData.get("password"),
    });
    if (await db.user.findUnique({ where: { email: data.email } })) {
      throw new UserError("Já existe uma conta com esse e-mail. Faça login.");
    }
    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp,
        passwordHash: await hashPassword(data.password),
        role: "MEMBER",
        mustChangePassword: false,
      },
    });
    await recordAttempt(ipKey);
    await startSession(user);
  } catch (e) {
    return toActionError(e);
  }
  redirect(next ?? "/");
}

const changeSchema = z
  .object({
    current: z.string().min(1, "Informe a senha atual."),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "As senhas não conferem." })
  .refine((d) => d.password !== d.current, { message: "A nova senha deve ser diferente da atual." });

export async function changePassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const next = safeNext(formData.get("next"));
  try {
    const me = await getCurrentUser();
    if (!me) throw new UserError("Faça login novamente.");
    const data = changeSchema.parse({
      current: formData.get("current"),
      password: formData.get("password"),
      confirm: formData.get("confirm"),
    });
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
  redirect(next ?? "/");
}

const profileSchema = z.object({ name: nameSchema, whatsapp: whatsappSchema });

/** Contas antigas sem WhatsApp completam o cadastro uma vez. */
export async function completeProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const next = safeNext(formData.get("next"));
  try {
    const me = await getCurrentUser();
    if (!me || me.mustChangePassword) throw new UserError("Faça login novamente.");
    const data = profileSchema.parse({ name: formData.get("name"), whatsapp: formData.get("whatsapp") });
    await db.user.update({ where: { id: me.id }, data });
  } catch (e) {
    return toActionError(e);
  }
  redirect(next ?? "/");
}

export async function updateProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const me = await requireAuth();
    const data = profileSchema.parse({ name: formData.get("name"), whatsapp: formData.get("whatsapp") });
    await db.user.update({ where: { id: me.id }, data });
    revalidatePath("/", "layout");
    return { message: "Perfil atualizado." };
  } catch (e) {
    return toActionError(e);
  }
}
