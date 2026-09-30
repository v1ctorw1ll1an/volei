import { z } from "zod";
import { parseBRL } from "@/lib/format";
import { normalizeWhatsapp } from "@/lib/whatsapp";

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

export const nameSchema = z.string().trim().min(1, "Informe o nome.").max(80);

export const emailSchema = z
  .string({ message: "Informe o e-mail." })
  .trim()
  .toLowerCase()
  .pipe(z.email("E-mail inválido."));

export const passwordSchema = z
  .string({ message: "Informe a senha." })
  .min(6, "A senha precisa de ao menos 6 caracteres.");

export const whatsappSchema = z
  .string({ message: "Informe o WhatsApp." })
  .transform((s) => normalizeWhatsapp(s))
  .pipe(z.string({ message: "WhatsApp inválido. Use DDD + número, ex.: (11) 99999-8888." }));

/** WhatsApp opcional (cadastro feito pelo superadmin): "" → null. */
export const optionalWhatsappSchema = z
  .string()
  .transform((s, ctx) => {
    if (s.trim() === "") return null;
    const n = normalizeWhatsapp(s);
    if (!n) ctx.addIssue({ code: "custom", message: "WhatsApp inválido. Use DDD + número." });
    return n;
  });
