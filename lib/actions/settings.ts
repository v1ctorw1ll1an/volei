"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { type ActionResult, toActionError } from "@/lib/action-result";
import { fields, optionalWhatsappSchema } from "@/lib/schemas";
import { THEMES } from "@/lib/themes";

const settingsSchema = z.object({
  clubName: z.string().trim().min(1, "Informe o nome do clube.").max(60),
  lightTheme: z.enum(THEMES, { message: "Tema inválido." }),
  darkTheme: z.enum(THEMES, { message: "Tema inválido." }),
  supportWhatsapp: optionalWhatsappSchema,
});

export async function saveSettings(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAuth({ superadmin: true });
    const data = settingsSchema.parse(fields(formData, ["clubName", "lightTheme", "darkTheme", "supportWhatsapp"]));
    await db.appSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
    revalidatePath("/", "layout");
    return { message: "Configurações salvas." };
  } catch (e) {
    return toActionError(e);
  }
}
