import { ActionForm, SubmitButton } from "@/components/action-form";
import { saveTemplate } from "@/lib/actions/templates";
import { centsToInput, WEEKDAYS } from "@/lib/format";

export type TemplateFormValues = {
  id?: string;
  name: string;
  location: string;
  weekday: number | null;
  time: string | null;
  capacity: number | null;
  courtPriceCents: number | null;
  notes: string;
};

export function TemplateForm({ values }: { values: TemplateFormValues }) {
  return (
    <ActionForm action={saveTemplate} hidden={{ id: values.id ?? "" }} className="flex flex-col gap-3">
      <label className="fieldset">
        <span className="fieldset-legend">Nome do modelo</span>
        <input name="name" required defaultValue={values.name} className="input w-full" placeholder="Quinta à noite" />
      </label>
      <label className="fieldset">
        <span className="fieldset-legend">Local</span>
        <input name="location" required defaultValue={values.location} className="input w-full" placeholder="Quadra do clube" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="fieldset">
          <span className="fieldset-legend">Dia da semana</span>
          <select name="weekday" defaultValue={values.weekday ?? ""} className="select w-full">
            <option value="">—</option>
            {WEEKDAYS.map((d, i) => (
              <option key={d} value={i}>{d}</option>
            ))}
          </select>
        </label>
        <label className="fieldset">
          <span className="fieldset-legend">Horário</span>
          <input name="time" type="time" defaultValue={values.time ?? ""} className="input w-full" />
        </label>
        <label className="fieldset">
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
        <label className="fieldset">
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
      <label className="fieldset">
        <span className="fieldset-legend">Observações</span>
        <textarea name="notes" defaultValue={values.notes} className="textarea w-full" rows={3} placeholder="Chave PIX, o que levar…" />
      </label>
      <SubmitButton className="btn btn-primary">Salvar modelo</SubmitButton>
    </ActionForm>
  );
}
