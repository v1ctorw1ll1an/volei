"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { type ConfirmOptions, useConfirm } from "@/components/confirm-dialog";
import type { ActionResult } from "@/lib/action-result";

type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

/** Formulário ligado a uma server action, mostrando erro/sucesso retornado. */
export function ActionForm({
  action,
  children,
  className,
  confirm,
  hidden,
  inlineFeedback = false,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  /** Confirmação (modal) antes de enviar. */
  confirm?: ConfirmOptions | string;
  /** Campos ocultos enviados junto. */
  hidden?: Record<string, string>;
  /** Feedback compacto (para botões pequenos em listas). */
  inlineFeedback?: boolean;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const ask = useConfirm();
  const approved = useRef(false);
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={async (e) => {
        if (approved.current) {
          approved.current = false; // já confirmado: deixa a action seguir
          return;
        }
        // A confirmação pode vir do botão clicado (data-confirm) ou do formulário.
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const fromButton = submitter?.dataset.confirm;
        const options = fromButton ? (JSON.parse(fromButton) as ConfirmOptions) : confirm;
        if (!options) return;
        e.preventDefault();
        const form = e.currentTarget;
        if (await ask(options)) {
          approved.current = true;
          form.requestSubmit(submitter);
        }
      }}
    >
      {hidden &&
        Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      {children}
      {state?.error &&
        (inlineFeedback ? (
          <p className="text-error text-xs w-full">{state.error}</p>
        ) : (
          <div role="alert" className="alert alert-error alert-soft text-sm w-full">
            {state.error}
          </div>
        ))}
      {state?.message &&
        (inlineFeedback ? (
          <p className="text-success text-xs w-full">{state.message}</p>
        ) : (
          <div role="status" className="alert alert-success alert-soft text-sm w-full">
            {state.message}
          </div>
        ))}
    </form>
  );
}

export function SubmitButton({
  children,
  className = "btn btn-primary",
  name,
  value,
  confirm,
}: {
  children: React.ReactNode;
  className?: string;
  name?: string;
  value?: string;
  /** Confirmação (modal) só para este botão. */
  confirm?: ConfirmOptions | string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      name={name}
      value={value}
      data-confirm={
        confirm ? JSON.stringify(typeof confirm === "string" ? { title: confirm } : confirm) : undefined
      }
    >
      {pending && <span className="loading loading-spinner loading-xs" />}
      {children}
    </button>
  );
}
