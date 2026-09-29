import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBRL, formatDateTime } from "@/lib/format";
import { describeSession, STATUS_BADGE, STATUS_LABEL } from "@/lib/session-view";

export const metadata = { title: "Todas as agendas" };

export default async function AllSessionsPage() {
  const user = await requireUser("ADMIN");
  const sessions = await db.gameSession.findMany({
    orderBy: { startsAt: "desc" },
    take: 100,
    include: { signups: { select: { userId: true, sortKey: true, createdAt: true, paymentStatus: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Todas as agendas</h1>
        <Link href="/admin/agendas/nova" className="btn btn-primary btn-sm">+ Nova agenda</Link>
      </div>
      {sessions.length === 0 ? (
        <p className="text-base-content/70">Nenhuma agenda criada ainda.</p>
      ) : (
        <ul className="list bg-base-100 rounded-box shadow-sm">
          {sessions.map((s) => {
            const { confirmed, price } = describeSession(s, user.id);
            const paid = confirmed.filter((c) => c.paymentStatus === "CONFIRMED").length;
            return (
              <li key={s.id} className="list-row items-center">
                <div className="list-col-grow min-w-0">
                  <Link href={`/agendas/${s.id}`} className="font-medium link link-hover">{s.title}</Link>
                  <div className="text-xs text-base-content/70 first-letter:uppercase">{formatDateTime(s.startsAt)}</div>
                  <div className="text-xs text-base-content/70">
                    {confirmed.length} confirmados · {paid} pagos · {formatBRL(price)}/pessoa
                  </div>
                </div>
                <span className={`badge badge-sm ${STATUS_BADGE[s.status]}`}>{STATUS_LABEL[s.status]}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
