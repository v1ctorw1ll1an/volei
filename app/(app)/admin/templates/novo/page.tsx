import Link from "next/link";
import { TemplateForm } from "@/components/template-form";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Novo modelo" };

export default async function NewTemplatePage() {
  await requireUser("ADMIN");
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/admin/templates" className="link link-hover text-sm">← Modelos</Link>
        <h1 className="text-2xl font-bold mt-1">Novo modelo</h1>
      </div>
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <TemplateForm
            values={{ name: "", location: "", weekday: null, time: "19:00", capacity: null, courtPriceCents: null, notes: "" }}
          />
        </div>
      </div>
    </div>
  );
}
