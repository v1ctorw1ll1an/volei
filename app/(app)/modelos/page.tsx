import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBRL, WEEKDAYS } from "@/lib/format";

export const metadata = { title: "Meus modelos" };

export default async function TemplatesPage() {
  const user = await requireUser();
  const templates = await db.sessionTemplate.findMany({
    where: { ownerId: user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus modelos</h1>
        <Link href="/modelos/novo" className="btn btn-primary btn-sm">+ Novo modelo</Link>
      </div>
      <p className="text-sm text-base-content/70">
        Salve o “setup” de um jogo recorrente (local, dia, horário, vagas e valor) e crie eventos com um clique.
      </p>
      {templates.length === 0 ? (
        <p className="text-base-content/70">Nenhum modelo salvo ainda.</p>
      ) : (
        <ul className="list bg-base-100 rounded-box shadow-sm">
          {templates.map((t) => (
            <li key={t.id} className="list-row items-center">
              <div className="list-col-grow min-w-0">
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-base-content/70">
                  {t.location}
                  {t.weekday != null && ` · ${WEEKDAYS[t.weekday]}`}
                  {t.time && ` ${t.time}`}
                  {` · ${t.capacity ?? "sem limite de"} vagas · quadra ${formatBRL(t.courtPriceCents)}`}
                </div>
              </div>
              <div className="flex gap-1">
                <Link href={`/eventos/novo?modelo=${t.id}`} className="btn btn-primary btn-xs">Criar evento</Link>
                <Link href={`/modelos/${t.id}`} className="btn btn-ghost btn-xs">Editar</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
