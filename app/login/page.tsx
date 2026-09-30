import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { login } from "@/lib/actions/auth";
import { safeNext, withNext } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { clubName, supportWhatsapp } = await getSettings();
  const next = safeNext((await searchParams).next);
  const fromEvent = next?.startsWith("/eventos/");

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="card bg-base-100 w-full max-w-sm shadow-md">
        <div className="card-body">
          <h1 className="text-2xl font-bold text-center">🏐 {clubName}</h1>
          <p className="text-center text-sm text-base-content/70 mb-2">
            {fromEvent
              ? "Você recebeu o link de um evento. Entre ou crie sua conta para ver e entrar na lista."
              : "Entre com seu e-mail e senha."}
          </p>
          <ActionForm action={login} hidden={{ next: next ?? "" }} className="flex flex-col gap-3">
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
          <div className="divider text-xs text-base-content/50 my-1">ainda não tem conta?</div>
          <Link href={withNext("/cadastro", next)} className="btn btn-outline w-full">
            Criar conta
          </Link>
          <p className="text-xs text-center text-base-content/60 mt-2">
            Esqueceu a senha?{" "}
            {supportWhatsapp ? (
              <a
                href={whatsappLink(supportWhatsapp, "Oi! Esqueci minha senha do app do vôlei.")}
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                Fale com o suporte no WhatsApp
              </a>
            ) : (
              "Peça ao administrador do app para definir uma nova."
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
