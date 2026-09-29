import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { changePassword } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Trocar senha" };

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sair");
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="card bg-base-100 w-full max-w-sm shadow-md">
        <div className="card-body">
          <h1 className="card-title">Trocar senha</h1>
          {user.mustChangePassword ? (
            <p className="text-sm text-base-content/70">
              Olá, {user.name}! Você entrou com uma senha provisória. Escolha uma senha sua para continuar.
            </p>
          ) : (
            <p className="text-sm text-base-content/70">Escolha uma nova senha.</p>
          )}
          <ActionForm action={changePassword} className="flex flex-col gap-3 mt-2">
            <input type="email" name="username" autoComplete="username" value={user.email} readOnly hidden />
            <label className="floating-label">
              <span>Senha atual</span>
              <input name="current" type="password" autoComplete="current-password" required placeholder="Senha atual" className="input w-full" />
            </label>
            <label className="floating-label">
              <span>Nova senha</span>
              <input name="password" type="password" autoComplete="new-password" minLength={6} required placeholder="Nova senha" className="input w-full" />
            </label>
            <label className="floating-label">
              <span>Repita a nova senha</span>
              <input name="confirm" type="password" autoComplete="new-password" minLength={6} required placeholder="Repita a nova senha" className="input w-full" />
            </label>
            <SubmitButton className="btn btn-primary w-full">Salvar senha</SubmitButton>
          </ActionForm>
          <div className="flex justify-between text-sm mt-2">
            {!user.mustChangePassword && <Link href="/" className="link">Voltar</Link>}
            <a href="/sair" className="link ml-auto">Sair</a>
          </div>
        </div>
      </div>
    </main>
  );
}
