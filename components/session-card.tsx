import Link from "next/link";
import type { PaymentStatus, SessionStatus } from "@/lib/generated/prisma/client";
import { formatBRL, formatDateTime } from "@/lib/format";
import { describeSession, PAYMENT_BADGE, PAYMENT_LABEL, STATUS_BADGE, STATUS_LABEL } from "@/lib/session-view";

type Props = {
  userId: string;
  session: {
    id: string;
    title: string;
    location: string;
    startsAt: Date;
    capacity: number | null;
    courtPriceCents: number;
    finalPricePerPersonCents: number | null;
    status: SessionStatus;
    signups: { userId: string; sortKey: Date; createdAt: Date; paymentStatus: PaymentStatus }[];
  };
};

export function SessionCard({ session, userId }: Props) {
  const { confirmed, waitlist, price, mine } = describeSession(session, userId);
  return (
    <Link
      href={`/agendas/${session.id}`}
      className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="card-body p-4 gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold text-lg leading-tight">{session.title}</h2>
            <p className="text-sm text-base-content/70 first-letter:uppercase">{formatDateTime(session.startsAt)}</p>
            <p className="text-sm text-base-content/70">{session.location}</p>
          </div>
          {session.status !== "OPEN" && (
            <span className={`badge badge-sm ${STATUS_BADGE[session.status]}`}>{STATUS_LABEL[session.status]}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="badge badge-outline">
            {confirmed.length}
            {session.capacity != null && `/${session.capacity}`} confirmados
          </span>
          {waitlist.length > 0 && <span className="badge badge-outline">{waitlist.length} na espera</span>}
          <span className="badge badge-outline">{formatBRL(price)} / pessoa</span>
        </div>
        {mine && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {mine.state === "in" ? (
              <>
                <span className="badge badge-primary">Você está dentro</span>
                <span className={`badge ${PAYMENT_BADGE[mine.signup.paymentStatus]}`}>
                  {PAYMENT_LABEL[mine.signup.paymentStatus]}
                </span>
              </>
            ) : (
              <span className="badge badge-secondary">Você é o {mine.position}º na espera</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
