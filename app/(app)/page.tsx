import Link from "next/link";
import { CreateAgendaTour } from "@/components/create-agenda-tour";
import { SessionCard } from "@/components/session-card";
import { hasRole, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { upcomingCutoff } from "@/lib/session-view";

const signupSelect = {
  select: { userId: true, sortKey: true, createdAt: true, paymentStatus: true },
} as const;

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  const { tutorial } = await searchParams;
  const cutoff = upcomingCutoff();

  const [upcoming, recent] = await Promise.all([
    db.gameSession.findMany({
      where: { startsAt: { gte: cutoff } },
      orderBy: { startsAt: "asc" },
      include: { signups: signupSelect },
    }),
    db.gameSession.findMany({
      where: { startsAt: { lt: cutoff }, status: { not: "CANCELED" } },
      orderBy: { startsAt: "desc" },
      take: 5,
      include: { signups: signupSelect },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Próximas agendas</h1>
          {hasRole(user, "ADMIN") && (
            <div className="flex items-center gap-1">
              <CreateAgendaTour part="inicio" autoStart={tutorial === "criar-agenda"} />
              <Link href="/admin/agendas/nova" className="btn btn-primary btn-sm" data-tour="nova-agenda">
                + Nova agenda
              </Link>
            </div>
          )}
        </div>
        {upcoming.length === 0 ? (
          <p className="text-base-content/70">Nenhuma agenda marcada por enquanto.</p>
        ) : (
          upcoming.map((s) => <SessionCard key={s.id} session={s} userId={user.id} />)
        )}
      </section>

      {recent.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-base-content/80">Anteriores</h2>
          {recent.map((s) => (
            <SessionCard key={s.id} session={s} userId={user.id} />
          ))}
        </section>
      )}
    </div>
  );
}
