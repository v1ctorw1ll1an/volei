"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { type ActionResult, toActionError } from "@/lib/action-result";
import { capacitySchema, fields, priceSchema } from "@/lib/schemas";
import { parseLocalInput } from "@/lib/format";
import { splitQueue } from "@/lib/queue";
import { pricePerPersonCents } from "@/lib/pricing";

const sessionSchema = z.object({
  title: z.string().trim().min(1, "Dê um título à agenda.").max(80),
  location: z.string().trim().min(1, "Informe o local.").max(120),
  startsAt: z
    .string()
    .transform((s) => parseLocalInput(s))
    .pipe(z.date({ message: "Informe data e hora." })),
  capacity: capacitySchema,
  courtPrice: priceSchema,
  notes: z.string().trim().max(500),
  templateId: z.string().transform((s) => s || null),
});

/** Valor por pessoa com a lista atual, para congelar ao fechar. */
async function currentPrice(sessionId: string) {
  const session = await db.gameSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { signups: { select: { sortKey: true, createdAt: true } } },
  });
  const { confirmed } = splitQueue(session.signups, session.capacity);
  return pricePerPersonCents(session.courtPriceCents, confirmed.length);
}

export async function saveSession(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  let id = String(formData.get("id") ?? "");
  try {
    const me = await requireRole("ADMIN");
    const { courtPrice, ...rest } = sessionSchema.parse(
      fields(formData, ["title", "location", "startsAt", "capacity", "courtPrice", "notes", "templateId"]),
    );
    const data = { ...rest, courtPriceCents: courtPrice };
    if (id) {
      const session = await db.gameSession.update({
        where: { id },
        data: { ...data, templateId: undefined }, // o modelo de origem não muda na edição
      });
      // Editar uma agenda fechada recalcula o valor congelado.
      if (session.status === "CLOSED") {
        await db.gameSession.update({
          where: { id },
          data: { finalPricePerPersonCents: await currentPrice(id) },
        });
      }
    } else {
      const session = await db.gameSession.create({ data: { ...data, createdById: me.id } });
      id = session.id;
    }
    revalidatePath("/", "layout");
  } catch (e) {
    return toActionError(e);
  }
  redirect(`/agendas/${id}`);
}

const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["OPEN", "CLOSED", "CANCELED"]),
});

export async function setSessionStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const { id, status } = statusSchema.parse(fields(formData, ["id", "status"]));
    const finalPricePerPersonCents = status === "CLOSED" ? await currentPrice(id) : null;
    await db.gameSession.update({ where: { id }, data: { status, finalPricePerPersonCents } });
    revalidatePath("/", "layout");
    const labels = { OPEN: "Agenda reaberta.", CLOSED: "Agenda fechada — valor congelado.", CANCELED: "Agenda cancelada." };
    return { message: labels[status] };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteSession(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const id = z.string().min(1).parse(formData.get("id"));
    await db.gameSession.delete({ where: { id } });
    revalidatePath("/", "layout");
  } catch (e) {
    return toActionError(e);
  }
  redirect("/");
}
