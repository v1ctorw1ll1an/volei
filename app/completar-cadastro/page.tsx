import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { completeProfile } from "@/lib/actions/auth";
import { getCurrentUser, safeNext, withNext } from "@/lib/auth";

export const metadata = { title: "Complete seu cadastro" };

/** Contas criadas antes do WhatsApp ser obrigatório passam aqui uma vez. */
export default async function CompleteProfilePage({ searchParams }: PageProps<"/completar-cadastro">) {
  const user = await getCurrentUser();
  if (!user) redirect("/sair");
  const next = safeNext((await searchParams).next);
  if (user.mustChangePassword) redirect(withNext("/trocar-senha", next));
  if (user.whatsapp) redirect(next ?? "/");

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="card bg-base-100 w-full max-w-sm shadow-md">
        <div className="card-body">
          <h1 className="card-title">Complete seu cadastro</h1>
          <p className="text-sm text-base-content/70">
            Agora o app pede o seu WhatsApp — é por ele que quem organiza o evento fala com você.
          </p>
          <ActionForm action={completeProfile} hidden={{ next: next ?? "" }} className="flex flex-col gap-3 mt-2">
            <label className="floating-label">
              <span>Nome</span>
              <input name="name" required maxLength={80} defaultValue={user.name} placeholder="Nome" className="input w-full" />
            </label>
            <label className="floating-label">
              <span>WhatsApp</span>
              <input
                name="whatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                required
                placeholder="WhatsApp com DDD"
                className="input w-full"
              />
            </label>
            <SubmitButton className="btn btn-primary w-full">Continuar</SubmitButton>
          </ActionForm>
          <a href="/sair" className="link text-sm text-right mt-2">Sair</a>
        </div>
      </div>
    </main>
  );
}
