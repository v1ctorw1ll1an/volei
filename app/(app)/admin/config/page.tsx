import { ActionForm, SubmitButton } from "@/components/action-form";
import { saveSettings } from "@/lib/actions/settings";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { THEMES } from "@/lib/themes";
import { formatWhatsapp } from "@/lib/whatsapp";

export const metadata = { title: "Configurações" };

function ThemePicker({ name, label, value }: { name: string; label: string; value: string }) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{label}</legend>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto p-1">
        {THEMES.map((t) => (
          <label
            key={t}
            data-theme={t}
            className="flex items-center gap-2 rounded-box border border-base-300 bg-base-100 text-base-content p-2 cursor-pointer has-checked:outline-2 has-checked:outline-primary"
          >
            <input type="radio" name={name} value={t} defaultChecked={t === value} className="radio radio-xs radio-primary" />
            <span className="text-xs flex-1 truncate">{t}</span>
            <span className="flex gap-0.5">
              <span className="size-2.5 rounded-full bg-primary" />
              <span className="size-2.5 rounded-full bg-secondary" />
              <span className="size-2.5 rounded-full bg-accent" />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default async function ConfigPage() {
  await requireUser({ superadmin: true });
  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <ActionForm action={saveSettings} className="flex flex-col gap-4">
            <label className="fieldset">
              <span className="fieldset-legend">Nome do clube</span>
              <input name="clubName" required defaultValue={settings.clubName} className="input w-full" />
            </label>
            <label className="fieldset">
              <span className="fieldset-legend">WhatsApp de suporte (opcional)</span>
              <input
                name="supportWhatsapp"
                type="tel"
                inputMode="tel"
                defaultValue={formatWhatsapp(settings.supportWhatsapp)}
                placeholder="(11) 99999-8888"
                className="input w-full"
              />
              <span className="label">Aparece no login para quem esqueceu a senha.</span>
            </label>
            <ThemePicker name="lightTheme" label="Tema claro" value={settings.lightTheme} />
            <ThemePicker name="darkTheme" label="Tema escuro" value={settings.darkTheme} />
            <p className="text-xs text-base-content/60">
              O app segue o modo claro/escuro do aparelho de cada pessoa (ou a escolha dela no botão de tema).
            </p>
            <SubmitButton>Salvar</SubmitButton>
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
