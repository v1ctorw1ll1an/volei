import { ActionForm, SubmitButton } from "@/components/action-form";
import { createUser, resetPassword, setUserActive, updateUser } from "@/lib/actions/users";
import { hasRole, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role } from "@/lib/generated/prisma/client";

export const metadata = { title: "Pessoas" };

const ROLE_LABEL: Record<Role, string> = {
  MEMBER: "Membro",
  ADMIN: "Organizador",
  SUPERADMIN: "Superadmin",
};

function RoleSelect({ defaultValue }: { defaultValue: Role }) {
  return (
    <select name="role" defaultValue={defaultValue} className="select w-full">
      {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
        <option key={r} value={r}>{ROLE_LABEL[r]}</option>
      ))}
    </select>
  );
}

export default async function UsersPage() {
  const me = await requireUser("ADMIN");
  const isSuper = hasRole(me, "SUPERADMIN");
  const users = await db.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Pessoas ({users.filter((u) => u.active).length})</h1>

      {isSuper && (
        <details className="collapse collapse-arrow bg-base-100 shadow-sm">
          <summary className="collapse-title font-semibold">+ Cadastrar pessoa</summary>
          <div className="collapse-content">
            <ActionForm action={createUser} className="flex flex-col gap-3">
              <input name="name" required placeholder="Nome" className="input w-full" />
              <input name="email" type="email" required placeholder="E-mail" className="input w-full" />
              <input
                name="password"
                required
                minLength={6}
                placeholder="Senha provisória"
                autoComplete="off"
                className="input w-full"
              />
              <RoleSelect defaultValue="MEMBER" />
              <p className="text-xs text-base-content/60">
                A pessoa entra com essa senha e é obrigada a trocá-la no primeiro acesso.
              </p>
              <SubmitButton>Cadastrar</SubmitButton>
            </ActionForm>
          </div>
        </details>
      )}

      <ul className="flex flex-col gap-2">
        {users.map((u) => {
          const canReset = u.id !== me.id && hasRole(me, u.role);
          return (
            <li key={u.id}>
              <details className={`collapse collapse-arrow bg-base-100 shadow-sm ${u.active ? "" : "opacity-60"}`}>
                <summary className="collapse-title">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{u.name}</span>
                    {u.role !== "MEMBER" && <span className="badge badge-sm badge-primary">{ROLE_LABEL[u.role]}</span>}
                    {u.mustChangePassword && <span className="badge badge-sm badge-warning">senha provisória</span>}
                    {!u.active && <span className="badge badge-sm">inativo</span>}
                  </div>
                  <div className="text-xs text-base-content/70">{u.email}</div>
                </summary>
                <div className="collapse-content flex flex-col gap-4">
                  {isSuper && (
                    <ActionForm action={updateUser} hidden={{ id: u.id }} className="flex flex-col gap-2">
                      <input name="name" required defaultValue={u.name} className="input input-sm w-full" />
                      <input name="email" type="email" required defaultValue={u.email} className="input input-sm w-full" />
                      <RoleSelect defaultValue={u.role} />
                      <SubmitButton className="btn btn-sm">Salvar dados</SubmitButton>
                    </ActionForm>
                  )}
                  {canReset && (
                    <ActionForm action={resetPassword} hidden={{ id: u.id }} className="flex flex-col gap-2">
                      <span className="text-sm font-medium">Definir senha provisória</span>
                      <div className="join w-full">
                        <input
                          name="password"
                          required
                          minLength={6}
                          autoComplete="off"
                          placeholder="Nova senha provisória"
                          className="input input-sm join-item flex-1"
                        />
                        <SubmitButton className="btn btn-sm btn-warning join-item">Redefinir</SubmitButton>
                      </div>
                    </ActionForm>
                  )}
                  {isSuper && u.id !== me.id && (
                    <ActionForm
                      action={setUserActive}
                      hidden={{ id: u.id, active: String(!u.active) }}
                      confirm={u.active ? `Desativar ${u.name}? A pessoa não conseguirá mais entrar.` : undefined}
                    >
                      <SubmitButton className={`btn btn-sm ${u.active ? "btn-ghost text-error" : "btn-success"}`}>
                        {u.active ? "Desativar" : "Reativar"}
                      </SubmitButton>
                    </ActionForm>
                  )}
                  {!isSuper && !canReset && (
                    <p className="text-sm text-base-content/60">Nada a fazer aqui.</p>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
