"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, hasRole, requireRole } from "@/lib/auth";
import { type ActionResult, toActionError, UserError } from "@/lib/action-result";

const roleSchema = z.enum(["MEMBER", "ADMIN", "SUPERADMIN"]);
const provisionalPassword = z.string().min(6, "A senha provisória precisa de ao menos 6 caracteres.");
const emailSchema = z.string().trim().toLowerCase().pipe(z.email("E-mail inválido."));
const nameSchema = z.string().trim().min(1, "Informe o nome.").max(80);

const createSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: provisionalPassword,
  role: roleSchema,
});

export async function createUser(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireRole("SUPERADMIN");
    const data = createSchema.parse(Object.fromEntries(formData));
    if (await db.user.findUnique({ where: { email: data.email } })) {
      throw new UserError("Já existe alguém com esse e-mail.");
    }
    await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        passwordHash: await hashPassword(data.password),
        mustChangePassword: true,
      },
    });
    revalidatePath("/", "layout");
    return { message: `${data.name} cadastrado(a). Passe a senha provisória pelo WhatsApp.` };
  } catch (e) {
    return toActionError(e);
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  name: nameSchema,
  email: emailSchema,
  role: roleSchema,
});

export async function updateUser(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const me = await requireRole("SUPERADMIN");
    const data = updateSchema.parse(Object.fromEntries(formData));
    if (data.id === me.id && data.role !== "SUPERADMIN") {
      throw new UserError("Você não pode tirar o seu próprio papel de superadmin.");
    }
    const clash = await db.user.findUnique({ where: { email: data.email } });
    if (clash && clash.id !== data.id) throw new UserError("Já existe alguém com esse e-mail.");
    await db.user.update({
      where: { id: data.id },
      data: { name: data.name, email: data.email, role: data.role },
    });
    revalidatePath("/", "layout");
    return { message: "Dados salvos." };
  } catch (e) {
    return toActionError(e);
  }
}

export async function setUserActive(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const me = await requireRole("SUPERADMIN");
    const id = z.string().min(1).parse(formData.get("id"));
    const active = formData.get("active") === "true";
    if (id === me.id) throw new UserError("Você não pode desativar a si mesmo.");
    await db.user.update({ where: { id }, data: { active } });
    revalidatePath("/", "layout");
    return { message: active ? "Usuário reativado." : "Usuário desativado." };
  } catch (e) {
    return toActionError(e);
  }
}

const resetSchema = z.object({ id: z.string().min(1), password: provisionalPassword });

export async function resetPassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const me = await requireRole("ADMIN");
    const data = resetSchema.parse(Object.fromEntries(formData));
    if (data.id === me.id) throw new UserError("Para trocar a sua senha, use “Trocar senha”.");
    const target = await db.user.findUnique({ where: { id: data.id } });
    if (!target) throw new UserError("Usuário não encontrado.");
    if (!hasRole(me, target.role)) {
      throw new UserError("Só um superadmin pode redefinir a senha de outro superadmin.");
    }
    await db.user.update({
      where: { id: data.id },
      data: { passwordHash: await hashPassword(data.password), mustChangePassword: true },
    });
    revalidatePath("/", "layout");
    return { message: `Senha provisória definida para ${target.name}. No próximo login será pedida a troca.` };
  } catch (e) {
    return toActionError(e);
  }
}
