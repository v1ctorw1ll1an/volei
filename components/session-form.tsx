import { ActionForm, SubmitButton } from "@/components/action-form";
import { saveSession } from "@/lib/actions/sessions";
import { centsToInput, toLocalInput } from "@/lib/format";

export type SessionFormValues = {
  id?: string;
  templateId?: string | null;
  title: string;
  location: string;
  startsAt: Date;
  capacity: number | null;
  courtPriceCents: number | null;
  notes: string;
};

export function SessionForm({ values, submitLabel }: { values: SessionFormValues; submitLabel: string }) {
  return (
    <ActionForm
      action={saveSession}
      hidden={{ id: values.id ?? "", templateId: values.templateId ?? "" }}
      className="flex flex-col gap-3"
    >
      <label className="fieldset" data-tour="titulo">
        <span className="fieldset-legend">Título</span>
        <input name="title" required defaultValue={values.title} className="input w-full" placeholder="Vôlei de quinta" />
      </label>
      <label className="fieldset" data-tour="local">
        <span className="fieldset-legend">Local</span>
        <input name="location" required defaultValue={values.location} className="input w-full" placeholder="Quadra do clube" />
      </label>
      <label className="fieldset" data-tour="data">
        <span className="fieldset-legend">Data e hora</span>
        <input
          name="startsAt"
          type="datetime-local"
          required
          defaultValue={toLocalInput(values.startsAt)}
          className="input w-full"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="fieldset" data-tour="vagas">
          <span className="fieldset-legend">Vagas</span>
          <input
            name="capacity"
            type="number"
            min={1}
            max={200}
            defaultValue={values.capacity ?? ""}
            className="input w-full"
            placeholder="Sem limite"
          />
        </label>
        <label className="fieldset" data-tour="valor">
          <span className="fieldset-legend">Valor da quadra (R$)</span>
          <input
            name="courtPrice"
            inputMode="decimal"
            required
            defaultValue={values.courtPriceCents != null ? centsToInput(values.courtPriceCents) : ""}
            className="input w-full"
            placeholder="120,00"
          />
        </label>
      </div>
      <label className="fieldset" data-tour="observacoes">
        <span className="fieldset-legend">Observações</span>
        <textarea name="notes" defaultValue={values.notes} className="textarea w-full" rows={3} placeholder="Chave PIX, o que levar…" />
      </label>
      <div data-tour="criar" className="flex flex-col">
        <SubmitButton className="btn btn-primary">{submitLabel}</SubmitButton>
      </div>
    </ActionForm>
  );
}
