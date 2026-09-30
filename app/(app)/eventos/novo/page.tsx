import Link from "next/link";
import { CreateEventTour } from "@/components/create-event-tour";
import { SessionForm } from "@/components/session-form";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { nextOccurrence, WEEKDAYS } from "@/lib/format";

export const metadata = { title: "Novo evento" };

export default async function NewEventPage({ searchParams }: PageProps<"/eventos/novo">) {
  const user = await requireUser();
  const { modelo, tutorial } = await searchParams;
  const templates = await db.sessionTemplate.findMany({ where: { ownerId: user.id }, orderBy: { name: "asc" } });
  const selected = templates.find((t) => t.id === modelo);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Novo evento</h1>
      {tutorial && <CreateEventTour part="formulario" autoStart />}

      <div className="flex flex-col gap-2" data-tour="modelos">
        <span className="text-sm text-base-content/70">Começar a partir de um modelo:</span>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/eventos/novo?modelo=${t.id}`}
              className={`btn btn-sm ${t.id === selected?.id ? "btn-primary" : "btn-outline"}`}
              replace
            >
              {t.name}
              {t.weekday != null && <span className="opacity-70">· {WEEKDAYS[t.weekday].slice(0, 3)}</span>}
            </Link>
          ))}
          {selected && (
            <Link href="/eventos/novo" className="btn btn-sm btn-ghost" replace>
              Em branco
            </Link>
          )}
          <Link href="/modelos/novo" className="btn btn-sm btn-ghost">
            + Novo modelo
          </Link>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <SessionForm
            key={selected?.id ?? "blank"}
            submitLabel="Criar evento"
            values={
              selected
                ? {
                    templateId: selected.id,
                    title: selected.name,
                    location: selected.location,
                    startsAt: nextOccurrence(selected.weekday, selected.time),
                    capacity: selected.capacity,
                    courtPriceCents: selected.courtPriceCents,
                    notes: selected.notes,
                  }
                : {
                    title: "",
                    location: "",
                    startsAt: nextOccurrence(null, "19:00"),
                    capacity: null,
                    courtPriceCents: null,
                    notes: "",
                  }
            }
          />
        </div>
      </div>
    </div>
  );
}
