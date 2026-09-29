"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
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
  /** Pergunta de confirmação antes de enviar. */
  confirm?: string;
  /** Campos ocultos enviados junto. */
  hidden?: Record<string, string>;
  /** Feedback compacto (para botões pequenos em listas). */
  inlineFeedback?: boolean;
}) {
  const [state, formAction] = useActionState(action, undefined);
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
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
  /** Pergunta de confirmação antes de enviar (por botão). */
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      name={name}
      value={value}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending && <span className="loading loading-spinner loading-xs" />}
      {children}
    </button>
  );
}
