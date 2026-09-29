import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { TemplateForm } from "@/components/template-form";
import { deleteTemplate } from "@/lib/actions/templates";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Editar modelo" };

export default async function EditTemplatePage({ params }: PageProps<"/admin/templates/[id]">) {
  await requireUser("ADMIN");
  const { id } = await params;
  const template = await db.sessionTemplate.findUnique({ where: { id } });
  if (!template) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/admin/templates" className="link link-hover text-sm">← Modelos</Link>
        <h1 className="text-2xl font-bold mt-1">Editar modelo</h1>
      </div>
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <TemplateForm values={template} />
        </div>
      </div>
      <ActionForm
        action={deleteTemplate}
        hidden={{ id: template.id }}
        confirm="Excluir este modelo? As agendas já criadas não são afetadas."
      >
        <SubmitButton className="btn btn-ghost btn-sm text-error">Excluir modelo</SubmitButton>
      </ActionForm>
    </div>
  );
}
