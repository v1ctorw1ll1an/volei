// O clube joga no Brasil: datas são exibidas e digitadas no fuso de São Paulo
// (sem horário de verão desde 2019, então o offset é fixo em -03:00).
export const TIME_ZONE = "America/Sao_Paulo";
const OFFSET_MS = 3 * 60 * 60 * 1000;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(cents: number | null | undefined) {
  if (cents == null) return "—";
  return brl.format(cents / 100);
}

/** "45,50" | "45.50" | "R$ 1.234,56" → centavos. */
export function parseBRL(input: string): number | null {
  let s = input.replace(/[R$\s]/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const value = Number(s);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

/** Centavos → "45,50" para preencher inputs. */
export function centsToInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateTimeLong(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Date → "YYYY-MM-DDTHH:MM" no fuso do clube (valor de <input type="datetime-local">). */
export function toLocalInput(date: Date) {
  return new Date(date.getTime() - OFFSET_MS).toISOString().slice(0, 16);
}

/** "YYYY-MM-DDTHH:MM" no fuso do clube → Date. */
export function parseLocalInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00-03:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Próxima ocorrência de um dia da semana/hora (no fuso do clube) a partir de agora. */
export function nextOccurrence(weekday: number | null, time: string | null, now = new Date()): Date {
  const [h, m] = (time ?? "19:00").split(":").map(Number);
  const local = new Date(now.getTime() - OFFSET_MS); // relógio de SP representado em UTC
  const candidate = new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), h, m),
  );
  if (weekday != null) {
    let diff = (weekday - candidate.getUTCDay() + 7) % 7;
    if (diff === 0 && candidate <= local) diff = 7;
    candidate.setUTCDate(candidate.getUTCDate() + diff);
  } else if (candidate <= local) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }
  return new Date(candidate.getTime() + OFFSET_MS);
}

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
