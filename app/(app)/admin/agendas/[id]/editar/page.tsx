import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionForm } from "@/components/session-form";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Editar agenda" };

export default async function EditSessionPage({ params }: PageProps<"/admin/agendas/[id]/editar">) {
  await requireUser("ADMIN");
  const { id } = await params;
  const session = await db.gameSession.findUnique({ where: { id } });
  if (!session) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href={`/agendas/${session.id}`} className="link link-hover text-sm">← Voltar para a agenda</Link>
        <h1 className="text-2xl font-bold mt-1">Editar agenda</h1>
      </div>
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <SessionForm values={session} submitLabel="Salvar" />
        </div>
      </div>
    </div>
  );
}
