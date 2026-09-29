import { z } from "zod";
import { parseBRL } from "@/lib/format";

/** Campo de formulário opcional: "" → null, senão inteiro dentro do intervalo. */
export const optionalInt = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .transform((s) => (s === "" ? null : Number(s)))
    .pipe(z.number().int(message).min(min, message).max(max, message).nullable());

export const priceSchema = z
  .string()
  .transform((s) => parseBRL(s))
  .pipe(z.number({ message: "Informe o valor da quadra (ex.: 120,00)." }).int());

export const capacitySchema = optionalInt(1, 200, "Capacidade deve ser um número entre 1 e 200.");

/** Lê campos de um FormData como strings ("" quando ausentes). */
export function fields<K extends string>(formData: FormData, keys: readonly K[]) {
  return Object.fromEntries(
    keys.map((k) => [k, String(formData.get(k) ?? "")]),
  ) as Record<K, string>;
}
