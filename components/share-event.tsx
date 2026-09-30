"use client";

import { useState } from "react";

/** Botões para compartilhar o link do evento (WhatsApp, copiar, compartilhar nativo do celular). */
export function ShareEvent({ eventId, title, when }: { eventId: string; title: string; when: string }) {
  const [copied, setCopied] = useState(false);

  const url = () => `${window.location.origin}/eventos/${eventId}`;
  const text = () => `🏐 ${title} — ${when}\nEntre na lista pelo link:`;

  async function copy() {
    await navigator.clipboard.writeText(url());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: text(), url: url() });
      } catch {
        // pessoa cancelou o compartilhamento
      }
    } else {
      await copy();
    }
  }

  return (
    <div className="card bg-base-100 shadow-sm" data-tour="compartilhar">
      <div className="card-body p-4 gap-3">
        <div>
          <h2 className="font-semibold">Convide a turma</h2>
          <p className="text-sm text-base-content/70">
            Quem abrir o link faz login ou cadastro e entra na lista.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <a
            className="btn btn-success btn-sm"
            target="_blank"
            rel="noopener noreferrer"
            href="#"
            onClick={(e) => {
              e.currentTarget.href = `https://wa.me/?text=${encodeURIComponent(`${text()} ${url()}`)}`;
            }}
          >
            Enviar no WhatsApp
          </a>
          <button type="button" className="btn btn-sm" onClick={copy}>
            {copied ? "Link copiado ✓" : "Copiar link"}
          </button>
          <button type="button" className="btn btn-sm btn-ghost col-span-2 sm:hidden" onClick={share}>
            Mais opções…
          </button>
        </div>
      </div>
    </div>
  );
}
