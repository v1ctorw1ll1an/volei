import Link from "next/link";
import { CreateEventTour } from "@/components/create-event-tour";
import { SessionCard } from "@/components/session-card";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { upcomingCutoff } from "@/lib/session-view";

const signupSelect = {
  select: { userId: true, sortKey: true, createdAt: true, paymentStatus: true },
} as const;

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  const { tutorial } = await searchParams;
  const cutoff = upcomingCutoff();
  // "Meus eventos": os que eu criei e os de que participo. Os demais são privados.
  const mine = { OR: [{ createdById: user.id }, { signups: { some: { userId: user.id } } }] };

  const [upcoming, recent] = await Promise.all([
    db.gameSession.findMany({
      where: { ...mine, startsAt: { gte: cutoff } },
      orderBy: { startsAt: "asc" },
      include: { signups: signupSelect },
    }),
    db.gameSession.findMany({
      where: { ...mine, startsAt: { lt: cutoff }, status: { not: "CANCELED" } },
      orderBy: { startsAt: "desc" },
      take: 5,
      include: { signups: signupSelect },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">Meus eventos</h1>
          <div className="flex items-center gap-1">
            <CreateEventTour part="inicio" autoStart={tutorial === "criar-evento"} />
            <Link href="/eventos/novo" className="btn btn-primary btn-sm" data-tour="novo-evento">
              + Novo evento
            </Link>
          </div>
        </div>
        {upcoming.length === 0 ? (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4 text-base-content/70">
              <p>Nenhum evento marcado por enquanto.</p>
              <p className="text-sm">
                Crie um evento e compartilhe o link com a turma — ou abra o link que alguém te mandou.
              </p>
            </div>
          </div>
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
