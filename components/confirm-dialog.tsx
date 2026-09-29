"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// Modal de confirmação (daisyUI) no lugar do window.confirm do navegador.

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" deixa o botão de confirmar vermelho (excluir, remover, cancelar…). */
  tone?: "primary" | "danger";
};

type Ask = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<Ask | null>(null);

export function useConfirm(): Ask {
  const ask = useContext(ConfirmContext);
  if (!ask) throw new Error("useConfirm precisa estar dentro de <ConfirmProvider>.");
  return ask;
}

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);

  const ask = useCallback<Ask>(
    (options) =>
      new Promise<boolean>((resolve) => {
        const opts = typeof options === "string" ? { title: options } : options;
        setPending({ ...opts, resolve });
      }),
    [],
  );

  useEffect(() => {
    if (pending && !dialog.current?.open) {
      dialog.current?.showModal();
      confirmButton.current?.focus();
    }
  }, [pending]);

  const finish = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
    if (dialog.current?.open) dialog.current.close();
  };

  const danger = pending?.tone === "danger";

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      <dialog
        ref={dialog}
        className="modal modal-bottom sm:modal-middle"
        onCancel={(e) => {
          e.preventDefault(); // Esc
          finish(false);
        }}
        aria-labelledby="confirm-title"
      >
        {pending && (
          <div className="modal-box">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className={`grid size-10 shrink-0 place-items-center rounded-full text-lg ${
                  danger ? "bg-error/15 text-error" : "bg-primary/15 text-primary"
                }`}
              >
                {danger ? "!" : "?"}
              </span>
              <div className="min-w-0">
                <h3 id="confirm-title" className="text-lg font-bold">
                  {pending.title}
                </h3>
                {pending.message && <p className="mt-1 text-base-content/75">{pending.message}</p>}
              </div>
            </div>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => finish(false)}>
                {pending.cancelLabel ?? "Voltar"}
              </button>
              <button
                ref={confirmButton}
                type="button"
                data-confirm-ok
                className={`btn ${danger ? "btn-error" : "btn-primary"}`}
                onClick={() => finish(true)}
              >
                {pending.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        )}
        <div className="modal-backdrop" onClick={() => finish(false)} />
      </dialog>
    </ConfirmContext.Provider>
  );
}
