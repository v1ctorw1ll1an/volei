import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { hasRole, requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [user, { clubName }] = await Promise.all([requireUser(), getSettings()]);
  const isAdmin = hasRole(user, "ADMIN");
  const isSuper = hasRole(user, "SUPERADMIN");

  return (
    <>
      <header className="navbar bg-base-100 shadow-sm sticky top-0 z-20 px-2 sm:px-4">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-lg px-2">
            🏐 {clubName}
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
              <span className="max-w-28 truncate">{user.name.split(" ")[0]}</span>
              <span aria-hidden>▾</span>
            </div>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-10 w-56 p-2 shadow">
              <li><Link href="/">Agendas</Link></li>
              {isAdmin && (
                <>
                  <li className="menu-title">Organização</li>
                  <li><Link href="/admin/agendas/nova">Nova agenda</Link></li>
                  <li><Link href="/admin/agendas">Todas as agendas</Link></li>
                  <li><Link href="/admin/templates">Modelos de agenda</Link></li>
                  <li><Link href="/?tutorial=criar-agenda">Tutorial: criar agenda</Link></li>
                  <li><Link href="/admin/usuarios">Pessoas</Link></li>
                </>
              )}
              {isSuper && <li><Link href="/admin/config">Configurações</Link></li>}
              <li className="menu-title">{user.email}</li>
              <li><Link href="/trocar-senha">Trocar senha</Link></li>
              <li><a href="/sair">Sair</a></li>
            </ul>
          </div>
        </div>
      </header>
      <main className="w-full max-w-3xl mx-auto p-3 sm:p-6 flex-1">{children}</main>
    </>
  );
}
