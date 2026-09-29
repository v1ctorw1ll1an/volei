"use client";

import { driver, type DriveStep, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

// Tutorial guiado (tela escurecida + destaque) de como criar uma agenda.
// Parte 1 roda na página inicial; parte 2 no formulário de nova agenda.

const DONE_KEY = "volei-tutorial-criar-agenda";
const FORM_URL = "/admin/agendas/nova?tutorial=1";
const TOTAL_STEPS = 10;

type Part = "inicio" | "formulario";

function buildSteps(part: Part, goToForm: () => void): DriveStep[] {
  if (part === "inicio") {
    return [
      {
        popover: {
          title: "Vamos criar uma agenda 🏐",
          description:
            "Em poucos passos você marca um jogo e a turma já pode entrar na lista pelo app. " +
            "Use <b>Próximo</b> para avançar ou o <b>×</b> para sair do tutorial.",
        },
      },
      {
        element: '[data-tour="nova-agenda"]',
        disableActiveInteraction: true,
        popover: {
          title: "Comece por aqui",
          description: "O botão <b>+ Nova agenda</b> abre o formulário. Vamos até lá?",
          side: "bottom",
          align: "end",
          nextBtnText: "Abrir formulário →",
          onNextClick: goToForm,
        },
      },
    ];
  }
  return [
    {
      element: '[data-tour="modelos"]',
      disableActiveInteraction: true,
      popover: {
        title: "Use um modelo (opcional)",
        description:
          "Se o jogo se repete — toda quinta, por exemplo — escolha um modelo salvo: local, horário, " +
          "vagas e valor já vêm preenchidos. Sem modelo, é só preencher à mão.",
        side: "bottom",
      },
    },
    {
      element: '[data-tour="titulo"]',
      popover: {
        title: "Dê um nome",
        description: "É o que a turma vê na lista de agendas. Ex.: <i>Vôlei de quinta</i>.",
        side: "bottom",
      },
    },
    {
      element: '[data-tour="local"]',
      popover: { title: "Onde vai ser", description: "O nome da quadra ou o endereço.", side: "bottom" },
    },
    {
      element: '[data-tour="data"]',
      popover: {
        title: "Data e hora",
        description: "Quando o jogo começa (horário de Brasília).",
        side: "bottom",
      },
    },
    {
      element: '[data-tour="vagas"]',
      popover: {
        title: "Vagas",
        description:
          "Quantas pessoas cabem. Quem passar disso entra na <b>lista de espera</b>, por ordem de chegada, " +
          "e sobe sozinho se alguém sair. Deixe vazio para não ter limite.",
        side: "top",
      },
    },
    {
      element: '[data-tour="valor"]',
      popover: {
        title: "Valor da quadra",
        description:
          "Informe o <b>total</b> da quadra. O app divide entre os confirmados e mostra o valor por pessoa, " +
          "atualizado a cada entrada ou saída.",
        side: "top",
      },
    },
    {
      element: '[data-tour="observacoes"]',
      popover: {
        title: "Observações",
        description: "Chave PIX, o que levar, regras do jogo… Aparece na página da agenda.",
        side: "top",
      },
    },
    {
      element: '[data-tour="criar"]',
      popover: {
        title: "Pronto!",
        description:
          "Toque em <b>Criar agenda</b>. Depois é só mandar o link no grupo do WhatsApp — cada um entra " +
          "na lista e marca “paguei” pelo app.",
        side: "top",
        doneBtnText: "Entendi!",
      },
    },
  ];
}

export function CreateAgendaTour({ part, autoStart = false }: { part: Part; autoStart?: boolean }) {
  const router = useRouter();
  const tour = useRef<Driver | null>(null);

  const start = useCallback(() => {
    tour.current?.destroy();
    const offset = part === "inicio" ? 0 : 2;
    const d = driver({
      steps: buildSteps(part, () => {
        d.destroy();
        router.push(FORM_URL);
      }),
      showProgress: true,
      popoverClass: "volei-tour",
      overlayOpacity: 0.7,
      stagePadding: 6,
      stageRadius: 12,
      overlayClickBehavior: () => {}, // toque fora não fecha sem querer (celular)
      nextBtnText: "Próximo →",
      prevBtnText: "← Voltar",
      doneBtnText: "Concluir",
      onPopoverRender: (popover, { state }) => {
        popover.progress.textContent = `Passo ${offset + (state.activeIndex ?? 0) + 1} de ${TOTAL_STEPS}`;
      },
      onDestroyed: () => localStorage.setItem(DONE_KEY, "1"),
    });
    tour.current = d;
    d.drive();
  }, [part, router]);

  useEffect(() => {
    // Na página inicial, abre sozinho no primeiro acesso de quem organiza.
    const firstVisit = part === "inicio" && !localStorage.getItem(DONE_KEY);
    if (!autoStart && !firstVisit) return;
    // Tira o ?tutorial da URL para não reabrir ao recarregar.
    if (autoStart) window.history.replaceState(null, "", window.location.pathname);
    const timer = setTimeout(start, 300);
    return () => clearTimeout(timer);
  }, [autoStart, part, start]);

  useEffect(() => () => tour.current?.destroy(), []);

  if (part !== "inicio") return null;
  return (
    <button type="button" onClick={start} className="btn btn-ghost btn-sm">
      Como criar?
    </button>
  );
}
