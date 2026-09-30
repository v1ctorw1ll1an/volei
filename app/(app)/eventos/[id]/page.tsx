import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { ShareEvent } from "@/components/share-event";
import { canManage, isSuperadmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBRL, formatDateTime, formatDateTimeLong } from "@/lib/format";
import {
  describeSession,
  PAYMENT_BADGE,
  PAYMENT_LABEL,
  STATUS_BADGE,
  STATUS_LABEL,
} from "@/lib/session-view";
import { formatWhatsapp, whatsappLink } from "@/lib/whatsapp";
import { deleteSession, setSessionStatus } from "@/lib/actions/sessions";
import {
  addToSession,
  confirmPayment,
  joinSession,
  leaveSession,
  markPaid,
  moveSignup,
  rejectPayment,
  removeSignup,
  unblockUser,
  unmarkPaid,
} from "@/lib/actions/signups";

export default async function EventPage({ params }: PageProps<"/eventos/[id]">) {
  const { id } = await params;
  const user = await requireUser({ next: `/eventos/${id}` });

  const session = await db.gameSession.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      signups: { include: { user: { select: { id: true, name: true, whatsapp: true } } } },
    },
  });
  if (!session) notFound();

  const isManager = canManage(user, session);
  const blocked =
    !isManager &&
    (await db.eventBlock.findUnique({
      where: { sessionId_userId: { sessionId: session.id, userId: user.id } },
    }));
  if (blocked) return <NoAccess />;

  const { confirmed, waitlist, price, mine, spotsLeft } = describeSession(session, user.id);
  // Quem ainda não entrou vê os dados e os números, mas não quem participa.
  const canSeeList = isManager || mine !== null;
  const isOpen = session.status === "OPEN";
  const sessionIdField = { sessionId: session.id };
  const whenShort = formatDateTime(session.startsAt);

  // Adicionar à mão: quem já participou de algum evento do criador (superadmin: qualquer pessoa).
  const [addable, blockedUsers] = isManager
    ? await Promise.all([
        db.user.findMany({
          where: {
            active: true,
            id: { notIn: session.signups.map((s) => s.userId) },
            ...(isSuperadmin(user)
              ? {}
              : { signups: { some: { session: { createdById: session.createdById } } } }),
          },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
        db.eventBlock.findMany({
          where: { sessionId: session.id },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        }),
      ])
    : [[], []];

  const paidCount = confirmed.filter((s) => s.paymentStatus === "CONFIRMED").length;
  const pendingCount = confirmed.filter((s) => s.paymentStatus === "PENDING").length;

  type Row = (typeof confirmed)[number];
  const renderRow = (s: Row, index: number, inList: boolean) => (
    <li key={s.id} className="list-row items-center py-2 px-3">
      <div className="text-base-content/50 tabular-nums w-6 text-right">{index + 1}</div>
      <div className="min-w-0">
        <div className={`truncate ${s.userId === user.id ? "font-semibold" : ""}`}>
          {s.user.name}
          {s.userId === user.id && " (você)"}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {inList && (
            <span className={`badge badge-xs ${PAYMENT_BADGE[s.paymentStatus]}`}>
              {PAYMENT_LABEL[s.paymentStatus]}
            </span>
          )}
          {isManager && s.user.whatsapp && s.userId !== user.id && (
            <a
              href={whatsappLink(
                s.user.whatsapp,
                `Oi, ${s.user.name.split(" ")[0]}! Sobre o ${session.title} (${whenShort})…`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-success text-xs"
              title={formatWhatsapp(s.user.whatsapp)}
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
      {isManager ? (
        <div className="flex flex-wrap justify-end gap-1">
          {inList && s.paymentStatus !== "CONFIRMED" && (
            <ActionForm action={confirmPayment} hidden={{ signupId: s.id }} inlineFeedback>
              <SubmitButton className="btn btn-success btn-xs">
                {s.paymentStatus === "PENDING" ? "Confirmar" : "Marcar pago"}
              </SubmitButton>
            </ActionForm>
          )}
          {inList && s.paymentStatus !== "UNPAID" && (
            <ActionForm action={rejectPayment} hidden={{ signupId: s.id }} inlineFeedback>
              <SubmitButton className="btn btn-ghost btn-xs">
                {s.paymentStatus === "PENDING" ? "Rejeitar" : "Desfazer"}
              </SubmitButton>
            </ActionForm>
          )}
          <ActionForm action={moveSignup} hidden={{ signupId: s.id, direction: "up" }} inlineFeedback>
            <SubmitButton className="btn btn-ghost btn-xs btn-square">
              <span aria-label="Subir">↑</span>
            </SubmitButton>
          </ActionForm>
          <ActionForm action={moveSignup} hidden={{ signupId: s.id, direction: "down" }} inlineFeedback>
            <SubmitButton className="btn btn-ghost btn-xs btn-square">
              <span aria-label="Descer">↓</span>
            </SubmitButton>
          </ActionForm>
          <ActionForm
            action={removeSignup}
            hidden={{ signupId: s.id }}
            confirm={{
              title: `Remover ${s.user.name}?`,
              message: "A pessoa sai da lista deste evento, mas pode entrar de novo pelo link.",
              confirmLabel: "Remover",
              tone: "danger",
            }}
            inlineFeedback
          >
            <SubmitButton className="btn btn-ghost btn-xs btn-square text-error">
              <span aria-label="Remover">✕</span>
            </SubmitButton>
          </ActionForm>
          {s.userId !== session.createdById && (
            <ActionForm
              action={removeSignup}
              hidden={{ signupId: s.id, block: "true" }}
              confirm={{
                title: `Remover e bloquear ${s.user.name}?`,
                message: "A pessoa sai da lista e não consegue mais abrir nem entrar neste evento. Dá para desbloquear depois.",
                confirmLabel: "Remover e bloquear",
                tone: "danger",
              }}
              inlineFeedback
            >
              <SubmitButton className="btn btn-ghost btn-xs btn-square text-error">
                <span aria-label="Remover e bloquear" title="Remover e bloquear">⛔</span>
              </SubmitButton>
            </ActionForm>
          )}
        </div>
      ) : (
        <span />
      )}
    </li>
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/" className="link link-hover text-sm">← Meus eventos</Link>
        <div className="flex items-start justify-between gap-2 mt-1">
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <span className={`badge ${STATUS_BADGE[session.status]}`}>{STATUS_LABEL[session.status]}</span>
        </div>
        <p className="text-base-content/70 first-letter:uppercase">{formatDateTimeLong(session.startsAt)}</p>
        <p className="text-base-content/70">{session.location}</p>
        <p className="text-sm text-base-content/60">
          Organizado por {session.createdById === user.id ? "você" : session.createdBy.name}
        </p>
        {session.notes && <p className="mt-2 whitespace-pre-line text-sm">{session.notes}</p>}
      </div>

      <div className="stats stats-horizontal bg-base-100 shadow-sm w-full">
        <div className="stat px-4 py-3">
          <div className="stat-title">Por pessoa</div>
          <div className="stat-value text-2xl text-primary">{formatBRL(price)}</div>
          <div className="stat-desc">
            {session.status === "CLOSED" ? "valor fechado" : `quadra ${formatBRL(session.courtPriceCents)}`}
          </div>
        </div>
        <div className="stat px-4 py-3">
          <div className="stat-title">Confirmados</div>
          <div className="stat-value text-2xl">
            {confirmed.length}
            {session.capacity != null && <span className="text-base font-normal">/{session.capacity}</span>}
          </div>
          <div className="stat-desc">
            {spotsLeft == null
              ? "sem limite"
              : spotsLeft > 0
                ? `${spotsLeft} vaga(s)`
                : `lotado · ${waitlist.length} na espera`}
          </div>
        </div>
      </div>

      {session.status !== "CANCELED" && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4 gap-3">
            {!mine ? (
              isOpen ? (
                <ActionForm action={joinSession} hidden={sessionIdField} className="flex flex-col gap-2">
                  <SubmitButton className="btn btn-primary w-full">
                    {spotsLeft === 0 ? "Entrar na lista de espera" : "Entrar na lista"}
                  </SubmitButton>
                  {!canSeeList && (
                    <p className="text-xs text-center text-base-content/60">
                      Depois de entrar você vê quem mais vai.
                    </p>
                  )}
                </ActionForm>
              ) : (
                <p className="text-sm text-base-content/70">As inscrições estão fechadas.</p>
              )
            ) : (
              <>
                <p>
                  {mine.state === "in" ? (
                    <>Você está <strong>confirmado(a)</strong> — {mine.position}º da lista.</>
                  ) : (
                    <>Você é o <strong>{mine.position}º na lista de espera</strong>. Se alguém sair, você sobe.</>
                  )}
                </p>
                {mine.state === "in" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge ${PAYMENT_BADGE[mine.signup.paymentStatus]}`}>
                      {PAYMENT_LABEL[mine.signup.paymentStatus]}
                    </span>
                    {mine.signup.paymentStatus === "UNPAID" && (
                      <ActionForm action={markPaid} hidden={sessionIdField} className="flex flex-col gap-2 w-full">
                        <SubmitButton className="btn btn-success w-full">
                          Paguei {price != null && formatBRL(price)}
                        </SubmitButton>
                      </ActionForm>
                    )}
                    {mine.signup.paymentStatus === "PENDING" && (
                      <>
                        <ActionForm action={unmarkPaid} hidden={sessionIdField}>
                          <SubmitButton className="btn btn-ghost btn-sm">Desfazer “paguei”</SubmitButton>
                        </ActionForm>
                        <p className="text-sm text-base-content/70 w-full">
                          Mande o comprovante no WhatsApp; quem organiza vai confirmar.
                        </p>
                      </>
                    )}
                  </div>
                )}
                {isOpen && mine.signup.paymentStatus !== "CONFIRMED" && (
                  <ActionForm
                    action={leaveSession}
                    hidden={sessionIdField}
                    confirm={{
                      title: "Sair da lista?",
                      message:
                        mine.state === "in"
                          ? "Sua vaga fica livre e o primeiro da lista de espera entra no seu lugar."
                          : "Você perde seu lugar na lista de espera.",
                      confirmLabel: "Sair da lista",
                      tone: "danger",
                    }}
                    className="flex flex-col gap-2"
                  >
                    <SubmitButton className="btn btn-outline btn-error btn-sm">Sair da lista</SubmitButton>
                  </ActionForm>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {canSeeList && session.status !== "CANCELED" && (
        <ShareEvent eventId={session.id} title={session.title} when={whenShort} />
      )}

      {canSeeList && (
        <>
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Lista ({confirmed.length})</h2>
              {isManager && confirmed.length > 0 && (
                <span className="text-xs text-base-content/70">
                  {paidCount} pago(s) · {pendingCount} aguardando ·{" "}
                  {confirmed.length - paidCount - pendingCount} não pago(s)
                </span>
              )}
            </div>
            {confirmed.length === 0 ? (
              <p className="text-sm text-base-content/70">Ninguém na lista ainda.</p>
            ) : (
              <ul className="list bg-base-100 rounded-box shadow-sm">
                {confirmed.map((s, i) => renderRow(s, i, true))}
              </ul>
            )}
          </section>

          {waitlist.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-semibold">Lista de espera ({waitlist.length})</h2>
              <ul className="list bg-base-100 rounded-box shadow-sm">
                {waitlist.map((s, i) => renderRow(s, i, false))}
              </ul>
            </section>
          )}
        </>
      )}

      {isManager && (
        <section className="card bg-base-100 shadow-sm">
          <div className="card-body p-4 gap-4">
            <h2 className="card-title text-base">Organização</h2>

            {addable.length > 0 && (
              <ActionForm action={addToSession} hidden={sessionIdField} className="flex flex-wrap gap-2">
                <select name="userId" className="select select-sm flex-1 min-w-40" required defaultValue="">
                  <option value="" disabled>Adicionar pessoa…</option>
                  {addable.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <SubmitButton className="btn btn-sm btn-primary">Adicionar</SubmitButton>
              </ActionForm>
            )}

            {/* Um único formulário para os três status, para a mensagem não sumir quando o botão muda. */}
            <ActionForm action={setSessionStatus} hidden={{ id: session.id }} className="flex flex-wrap gap-2">
              <Link href={`/eventos/${session.id}/editar`} className="btn btn-sm">Editar</Link>
              {session.status !== "CLOSED" && (
                <SubmitButton
                  name="status"
                  value="CLOSED"
                  className="btn btn-sm btn-neutral"
                  confirm={{
                    title: "Fechar o evento?",
                    message: `As inscrições são encerradas e o valor por pessoa fica congelado em ${formatBRL(price)}.`,
                    confirmLabel: "Fechar evento",
                  }}
                >
                  Fechar evento
                </SubmitButton>
              )}
              {session.status !== "OPEN" && (
                <SubmitButton name="status" value="OPEN" className="btn btn-sm">Reabrir</SubmitButton>
              )}
              {session.status !== "CANCELED" && (
                <SubmitButton
                  name="status"
                  value="CANCELED"
                  className="btn btn-sm btn-warning btn-outline"
                  confirm={{
                    title: "Cancelar este evento?",
                    message: "O jogo aparece como cancelado para todos. Dá para reabrir depois.",
                    confirmLabel: "Cancelar evento",
                    tone: "danger",
                  }}
                >
                  Cancelar evento
                </SubmitButton>
              )}
            </ActionForm>
            <div className="flex flex-wrap gap-2">
              <ActionForm
                action={deleteSession}
                hidden={{ id: session.id }}
                confirm={{
                  title: "Excluir o evento?",
                  message: "O evento e toda a lista (inclusive os pagamentos) serão apagados. Isso não pode ser desfeito.",
                  confirmLabel: "Excluir",
                  tone: "danger",
                }}
              >
                <SubmitButton className="btn btn-sm btn-error btn-ghost">Excluir</SubmitButton>
              </ActionForm>
            </div>
            {session.status === "CLOSED" && (
              <p className="text-xs text-base-content/60">
                Mudanças na lista não alteram o valor fechado. Reabra e feche de novo para recalcular.
              </p>
            )}

            {blockedUsers.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Bloqueados ({blockedUsers.length})</h3>
                <ul className="flex flex-col gap-1">
                  {blockedUsers.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-2 text-sm">
                      <span>{b.user.name}</span>
                      <ActionForm
                        action={unblockUser}
                        hidden={{ sessionId: session.id, userId: b.user.id }}
                        inlineFeedback
                      >
                        <SubmitButton className="btn btn-ghost btn-xs">Desbloquear</SubmitButton>
                      </ActionForm>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function NoAccess() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <h1 className="text-xl font-bold">Você não tem acesso a este evento</h1>
      <p className="text-base-content/70">Se achar que é um engano, fale com quem te mandou o link.</p>
      <Link href="/" className="btn btn-primary btn-sm">Meus eventos</Link>
    </div>
  );
}
