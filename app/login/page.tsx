import { ActionForm, SubmitButton } from "@/components/action-form";
import { login } from "@/lib/actions/auth";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  const { clubName } = await getSettings();
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="card bg-base-100 w-full max-w-sm shadow-md">
        <div className="card-body">
          <h1 className="text-2xl font-bold text-center">🏐 {clubName}</h1>
          <p className="text-center text-sm text-base-content/70 mb-2">Entre com seu e-mail e senha.</p>
          <ActionForm action={login} className="flex flex-col gap-3">
            <label className="floating-label">
              <span>E-mail</span>
              <input name="email" type="email" autoComplete="email" required placeholder="E-mail" className="input w-full" />
            </label>
            <label className="floating-label">
              <span>Senha</span>
              <input name="password" type="password" autoComplete="current-password" required placeholder="Senha" className="input w-full" />
            </label>
            <SubmitButton className="btn btn-primary w-full">Entrar</SubmitButton>
          </ActionForm>
          <p className="text-xs text-center text-base-content/60 mt-2">
            Esqueceu a senha? Peça ao organizador para definir uma nova.
          </p>
        </div>
      </div>
    </main>
  );
}
