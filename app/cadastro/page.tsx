import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { signup } from "@/lib/actions/auth";
import { safeNext, withNext } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Criar conta" };

export default async function SignupPage({ searchParams }: PageProps<"/cadastro">) {
  const { clubName } = await getSettings();
  const next = safeNext((await searchParams).next);

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="card bg-base-100 w-full max-w-sm shadow-md">
        <div className="card-body">
          <h1 className="text-2xl font-bold text-center">🏐 {clubName}</h1>
          <p className="text-center text-sm text-base-content/70 mb-2">Crie sua conta — leva um minuto.</p>
          <ActionForm action={signup} hidden={{ next: next ?? "" }} className="flex flex-col gap-3">
            <label className="floating-label">
              <span>Nome</span>
              <input name="name" autoComplete="name" required maxLength={80} placeholder="Nome" className="input w-full" />
            </label>
            <label className="floating-label">
              <span>E-mail</span>
              <input name="email" type="email" autoComplete="email" required placeholder="E-mail" className="input w-full" />
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
            <label className="floating-label">
              <span>Senha</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Senha (mín. 6 caracteres)"
                className="input w-full"
              />
            </label>
            {/* Armadilha para robôs: escondido de pessoas e leitores de tela. */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Site
                <input name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
              </label>
            </div>
            <SubmitButton className="btn btn-primary w-full">Criar conta</SubmitButton>
          </ActionForm>
          <p className="text-sm text-center mt-2">
            Já tem conta?{" "}
            <Link href={withNext("/login", next)} className="link">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
