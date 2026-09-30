import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { updateProfile } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth";
import { formatWhatsapp } from "@/lib/whatsapp";

export const metadata = { title: "Meu perfil" };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Meu perfil</h1>
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <ActionForm action={updateProfile} className="flex flex-col gap-3">
            <label className="fieldset">
              <span className="fieldset-legend">Nome</span>
              <input name="name" required maxLength={80} defaultValue={user.name} className="input w-full" />
            </label>
            <label className="fieldset">
              <span className="fieldset-legend">WhatsApp</span>
              <input
                name="whatsapp"
                type="tel"
                inputMode="tel"
                required
                defaultValue={formatWhatsapp(user.whatsapp)}
                className="input w-full"
              />
            </label>
            <label className="fieldset">
              <span className="fieldset-legend">E-mail</span>
              <input value={user.email} readOnly disabled className="input w-full" />
              <span className="label">Para trocar o e-mail, fale com o administrador do app.</span>
            </label>
            <SubmitButton>Salvar</SubmitButton>
          </ActionForm>
        </div>
      </div>
      <Link href="/trocar-senha" className="link text-sm">Trocar senha</Link>
    </div>
  );
}
