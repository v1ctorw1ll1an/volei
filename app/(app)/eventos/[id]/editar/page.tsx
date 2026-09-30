import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SessionForm } from "@/components/session-form";
import { canManage, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Editar evento" };

export default async function EditEventPage({ params }: PageProps<"/eventos/[id]/editar">) {
  const { id } = await params;
  const user = await requireUser({ next: `/eventos/${id}/editar` });
  const session = await db.gameSession.findUnique({ where: { id } });
  if (!session) notFound();
  if (!canManage(user, session)) redirect(`/eventos/${id}`);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href={`/eventos/${session.id}`} className="link link-hover text-sm">← Voltar para o evento</Link>
        <h1 className="text-2xl font-bold mt-1">Editar evento</h1>
      </div>
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <SessionForm values={session} submitLabel="Salvar" />
        </div>
      </div>
    </div>
  );
}
