// Números de WhatsApp brasileiros guardados só com dígitos e DDI: "5511999998888".

/** "(11) 99999-8888", "11999998888", "+55 11 9999-8888" → "5511999998888" (ou null se inválido). */
export function normalizeWhatsapp(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  // DDD (2 dígitos, sem zero) + fixo (8) ou celular (9, começando com 9)
  if (!/^[1-9]\d(9\d{8}|[2-8]\d{7})$/.test(digits)) return null;
  return `55${digits}`;
}

/** "5511999998888" → "(11) 99999-8888". */
export function formatWhatsapp(stored: string | null | undefined) {
  if (!stored) return "";
  const local = stored.startsWith("55") ? stored.slice(2) : stored;
  const ddd = local.slice(0, 2);
  const rest = local.slice(2);
  const split = rest.length - 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/** Link para abrir a conversa (opcionalmente com mensagem pronta). */
export function whatsappLink(stored: string, text?: string) {
  return `https://wa.me/${stored}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
