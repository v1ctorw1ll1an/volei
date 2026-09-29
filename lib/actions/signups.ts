"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { type ActionResult, toActionError, UserError } from "@/lib/action-result";
import { splitQueue } from "@/lib/queue";

const id = z.string().min(1);

async function getSession(sessionId: string) {
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new UserError("Agenda não encontrada.");
  return session;
}

function done(message?: string): ActionResult {
  revalidatePath("/", "layout");
  return message ? { message } : undefined;
}

// ——— Ações do próprio membro ———

export async function joinSession(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const me = await requireRole("MEMBER");
    const session = await getSession(id.parse(formData.get("sessionId")));
    if (session.status !== "OPEN") throw new UserError("As inscrições desta agenda estão fechadas.");
    await db.signup.upsert({
      where: { sessionId_userId: { sessionId: session.id, userId: me.id } },
      update: {},
      create: { sessionId: session.id, userId: me.id },
    });
    return done();
  } catch (e) {
    return toActionError(e);
  }
}

export async function leaveSession(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const me = await requireRole("MEMBER");
    const session = await getSession(id.parse(formData.get("sessionId")));
    if (session.status !== "OPEN") throw new UserError("A agenda já foi fechada. Fale com o organizador.");
    const signup = await db.signup.findUnique({
      where: { sessionId_userId: { sessionId: session.id, userId: me.id } },
    });
    if (!signup) return done();
    if (signup.paymentStatus === "CONFIRMED") {
      throw new UserError("Seu pagamento já foi confirmado. Fale com o organizador para sair.");
    }
    await db.signup.delete({ where: { id: signup.id } });
    return done();
  } catch (e) {
    return toActionError(e);
  }
}

export async function markPaid(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const me = await requireRole("MEMBER");
    const session = await getSession(id.parse(formData.get("sessionId")));
    if (session.status === "CANCELED") throw new UserError("Esta agenda foi cancelada.");
    const signups = await db.signup.findMany({ where: { sessionId: session.id } });
    const { confirmed } = splitQueue(signups, session.capacity);
    const mine = confirmed.find((s) => s.userId === me.id);
    if (!mine) throw new UserError("Só quem está confirmado na lista paga.");
    if (mine.paymentStatus !== "UNPAID") return done();
    await db.signup.update({
      where: { id: mine.id },
      data: { paymentStatus: "PENDING", paidMarkedAt: new Date() },
    });
    return done();
  } catch (e) {
    return toActionError(e);
  }
}

export async function unmarkPaid(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const me = await requireRole("MEMBER");
    const sessionId = id.parse(formData.get("sessionId"));
    await db.signup.updateMany({
      where: { sessionId, userId: me.id, paymentStatus: "PENDING" },
      data: { paymentStatus: "UNPAID", paidMarkedAt: null },
    });
    return done();
  } catch (e) {
    return toActionError(e);
  }
}

// ——— Ações do admin ———

export async function addToSession(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const session = await getSession(id.parse(formData.get("sessionId")));
    const userId = id.parse(formData.get("userId"));
    await db.signup.upsert({
      where: { sessionId_userId: { sessionId: session.id, userId } },
      update: {},
      create: { sessionId: session.id, userId },
    });
    return done();
  } catch (e) {
    return toActionError(e);
  }
}

export async function removeSignup(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    await db.signup.delete({ where: { id: id.parse(formData.get("signupId")) } });
    return done();
  } catch (e) {
    return toActionError(e);
  }
}

/** Sobe/desce alguém na fila, redistribuindo os mesmos sortKeys na nova ordem. */
export async function moveSignup(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const signupId = id.parse(formData.get("signupId"));
    const direction = z.enum(["up", "down"]).parse(formData.get("direction"));
    const target = await db.signup.findUnique({ where: { id: signupId } });
    if (!target) throw new UserError("Inscrição não encontrada.");

    const { ordered } = splitQueue(
      await db.signup.findMany({ where: { sessionId: target.sessionId } }),
      null,
    );
    const from = ordered.findIndex((s) => s.id === signupId);
    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= ordered.length) return done();

    const keys = ordered.map((s) => s.sortKey.getTime());
    for (let i = 1; i < keys.length; i++) keys[i] = Math.max(keys[i], keys[i - 1] + 1);
    const reordered = [...ordered];
    [reordered[from], reordered[to]] = [reordered[to], reordered[from]];

    await db.$transaction(
      reordered.map((s, i) =>
        db.signup.update({ where: { id: s.id }, data: { sortKey: new Date(keys[i]) } }),
      ),
    );
    return done();
  } catch (e) {
    return toActionError(e);
  }
}

export async function confirmPayment(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const me = await requireRole("ADMIN");
    await db.signup.update({
      where: { id: id.parse(formData.get("signupId")) },
      data: { paymentStatus: "CONFIRMED", confirmedById: me.id, confirmedAt: new Date() },
    });
    return done();
  } catch (e) {
    return toActionError(e);
  }
}

export async function rejectPayment(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    await db.signup.update({
      where: { id: id.parse(formData.get("signupId")) },
      data: { paymentStatus: "UNPAID", paidMarkedAt: null, confirmedById: null, confirmedAt: null },
    });
    return done();
  } catch (e) {
    return toActionError(e);
  }
}
