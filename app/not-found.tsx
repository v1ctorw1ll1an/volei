import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
      <h1 className="text-2xl font-bold">Não encontrado</h1>
      <p className="text-base-content/70">Essa página não existe ou foi removida.</p>
      <Link href="/" className="btn btn-primary btn-sm">Voltar ao início</Link>
    </main>
  );
}
