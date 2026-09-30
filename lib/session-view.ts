import type { PaymentStatus, SessionStatus } from "@/lib/generated/prisma/client";
import { splitQueue } from "@/lib/queue";
import { sessionPricePerPerson } from "@/lib/pricing";

type SignupLike = { userId: string; sortKey: Date; createdAt: Date; paymentStatus: PaymentStatus };

type SessionLike<T extends SignupLike> = {
  capacity: number | null;
  courtPriceCents: number;
  finalPricePerPersonCents: number | null;
  status: SessionStatus;
  signups: T[];
};

/** Resumo de um evento do ponto de vista de um usuário. */
export function describeSession<T extends SignupLike>(session: SessionLike<T>, userId: string) {
  const { confirmed, waitlist } = splitQueue(session.signups, session.capacity);
  const price = sessionPricePerPerson(session, confirmed.length);
  const confirmedIdx = confirmed.findIndex((s) => s.userId === userId);
  const waitIdx = waitlist.findIndex((s) => s.userId === userId);
  const mine =
    confirmedIdx >= 0
      ? { state: "in" as const, signup: confirmed[confirmedIdx], position: confirmedIdx + 1 }
      : waitIdx >= 0
        ? { state: "wait" as const, signup: waitlist[waitIdx], position: waitIdx + 1 }
        : null;
  const spotsLeft = session.capacity == null ? null : Math.max(0, session.capacity - confirmed.length);
  return { confirmed, waitlist, price, mine, spotsLeft };
}

export const STATUS_LABEL: Record<SessionStatus, string> = {
  OPEN: "Aberto",
  CLOSED: "Fechado",
  CANCELED: "Cancelado",
};

export const STATUS_BADGE: Record<SessionStatus, string> = {
  OPEN: "badge-success",
  CLOSED: "badge-neutral",
  CANCELED: "badge-error",
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "Não pago",
  PENDING: "Aguardando confirmação",
  CONFIRMED: "Pago",
};

export const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  UNPAID: "badge-ghost",
  PENDING: "badge-warning",
  CONFIRMED: "badge-success",
};

/** Um evento continua em "Próximos" até 6h depois do início. */
export function upcomingCutoff() {
  return new Date(Date.now() - 6 * 60 * 60 * 1000);
}
