"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { isSuperadmin, requireAuth, requireManager } from "@/lib/auth";
import { type ActionResult, toActionError, UserError } from "@/lib/action-result";
import { splitQueue } from "@/lib/queue";

const id = z.string().min(1);

async function getSession(sessionId: string) {
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new UserError("Evento não encontrado.");
  return session;
}

/** Busca a inscrição e garante que quem pede é o organizador daquele evento. */
async function manageSignup(signupId: string) {
  const signup = await db.signup.findUnique({ where: { id: signupId } });
  if (!signup) throw new UserError("Inscrição não encontrada.");
  const { user, event } = await requireManager(signup.sessionId);
  return { signup, user, event };
}

function done(message?: string): ActionResult {
  revalidatePath("/", "layout");
  return message ? { message } : undefined;
}

// ——— Ações do próprio participante ———

export async function joinSession(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const me = await requireAuth();
    const session = await getSession(id.parse(formData.get("sessionId")));
    const blocked = await db.eventBlock.findUnique({
      where: { sessionId_userId: { sessionId: session.id, userId: me.id } },
    });
    if (blocked) throw new UserError("Você não tem acesso a este evento.");
    if (session.status !== "OPEN") throw new UserError("As inscrições deste evento estão fechadas.");
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
    const me = await requireAuth();
    const session = await getSession(id.parse(formData.get("sessionId")));
    if (session.status !== "OPEN") throw new UserError("O evento já foi fechado. Fale com quem organiza.");
    const signup = await db.signup.findUnique({
      where: { sessionId_userId: { sessionId: session.id, userId: me.id } },
    });
    if (!signup) return done();
    if (signup.paymentStatus === "CONFIRMED") {
      throw new UserError("Seu pagamento já foi confirmado. Fale com quem organiza para sair.");
    }
    await db.signup.delete({ where: { id: signup.id } });
    return done();
  } catch (e) {
    return toActionError(e);
  }
}

export async function markPaid(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const me = await requireAuth();
    const session = await getSession(id.parse(formData.get("sessionId")));
    if (session.status === "CANCELED") throw new UserError("Este evento foi cancelado.");
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
    const me = await requireAuth();
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

// ——— Ações de quem organiza (criador do evento ou superadmin) ———

/**
 * Adicionar à mão: o organizador só pode escolher quem já participou de algum
 * evento dele (o superadmin pode adicionar qualquer pessoa ativa).
 */
export async function addToSession(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const sessionId = id.parse(formData.get("sessionId"));
    const userId = id.parse(formData.get("userId"));
    const { user, event } = await requireManager(sessionId);
    const target = await db.user.findFirst({
      where: {
        id: userId,
        active: true,
        ...(isSuperadmin(user)
          ? {}
          : { signups: { some: { session: { createdById: event.createdById } } } }),
      },
    });
    if (!target) throw new UserError("Pessoa não encontrada.");
    await db.$transaction([
      db.eventBlock.deleteMany({ where: { sessionId, userId } }),
      db.signup.upsert({
        where: { sessionId_userId: { sessionId, userId } },
        update: {},
        create: { sessionId, userId },
      }),
    ]);
    return done();
  } catch (e) {
    return toActionError(e);
  }
}

/** Remove da lista; com block=true a pessoa também fica bloqueada neste evento. */
export async function removeSignup(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { signup, event } = await manageSignup(id.parse(formData.get("signupId")));
    const block = formData.get("block") === "true";
    if (block && signup.userId === event.createdById) {
      throw new UserError("Quem criou o evento não pode ser bloqueado.");
    }
    await db.$transaction([
      db.signup.delete({ where: { id: signup.id } }),
      ...(block
        ? [
            db.eventBlock.upsert({
              where: { sessionId_userId: { sessionId: signup.sessionId, userId: signup.userId } },
              update: {},
              create: { sessionId: signup.sessionId, userId: signup.userId },
            }),
          ]
        : []),
    ]);
    return done();
  } catch (e) {
    return toActionError(e);
  }
}

export async function unblockUser(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const sessionId = id.parse(formData.get("sessionId"));
    await requireManager(sessionId);
    await db.eventBlock.deleteMany({ where: { sessionId, userId: id.parse(formData.get("userId")) } });
    return done();
  } catch (e) {
    return toActionError(e);
  }
}

/** Sobe/desce alguém na fila, redistribuindo os mesmos sortKeys na nova ordem. */
export async function moveSignup(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { signup: target } = await manageSignup(id.parse(formData.get("signupId")));
    const direction = z.enum(["up", "down"]).parse(formData.get("direction"));

    const { ordered } = splitQueue(
      await db.signup.findMany({ where: { sessionId: target.sessionId } }),
      null,
    );
    const from = ordered.findIndex((s) => s.id === target.id);
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
    const { signup, user } = await manageSignup(id.parse(formData.get("signupId")));
    await db.signup.update({
      where: { id: signup.id },
      data: { paymentStatus: "CONFIRMED", confirmedById: user.id, confirmedAt: new Date() },
    });
    return done();
  } catch (e) {
    return toActionError(e);
  }
}

export async function rejectPayment(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { signup } = await manageSignup(id.parse(formData.get("signupId")));
    await db.signup.update({
      where: { id: signup.id },
      data: { paymentStatus: "UNPAID", paidMarkedAt: null, confirmedById: null, confirmedAt: null },
    });
    return done();
  } catch (e) {
    return toActionError(e);
  }
}
