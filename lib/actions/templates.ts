"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { type ActionResult, toActionError, UserError } from "@/lib/action-result";
import { capacitySchema, fields, optionalInt, priceSchema } from "@/lib/schemas";

const templateSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome ao modelo.").max(80),
  location: z.string().trim().min(1, "Informe o local.").max(120),
  weekday: optionalInt(0, 6, "Dia da semana inválido."),
  time: z
    .string()
    .trim()
    .transform((s) => (s === "" ? null : s))
    .pipe(z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido.").nullable()),
  capacity: capacitySchema,
  courtPrice: priceSchema,
  notes: z.string().trim().max(500),
});

/** Cada pessoa só mexe nos próprios modelos. */
async function ownTemplate(id: string, userId: string) {
  const template = await db.sessionTemplate.findUnique({ where: { id } });
  if (!template || template.ownerId !== userId) throw new UserError("Modelo não encontrado.");
  return template;
}

export async function saveTemplate(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const me = await requireAuth();
    const { courtPrice, ...rest } = templateSchema.parse(
      fields(formData, ["name", "location", "weekday", "time", "capacity", "courtPrice", "notes"]),
    );
    const data = { ...rest, courtPriceCents: courtPrice };
    const id = String(formData.get("id") ?? "");
    if (id) {
      await ownTemplate(id, me.id);
      await db.sessionTemplate.update({ where: { id }, data });
    } else {
      await db.sessionTemplate.create({ data: { ...data, ownerId: me.id } });
    }
    revalidatePath("/", "layout");
  } catch (e) {
    return toActionError(e);
  }
  redirect("/modelos");
}

export async function deleteTemplate(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const me = await requireAuth();
    const id = z.string().min(1).parse(formData.get("id"));
    await ownTemplate(id, me.id);
    await db.sessionTemplate.delete({ where: { id } });
    revalidatePath("/", "layout");
  } catch (e) {
    return toActionError(e);
  }
  redirect("/modelos");
}
