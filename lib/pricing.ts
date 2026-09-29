/** Valor por pessoa em centavos, arredondado para cima. */
export function pricePerPersonCents(courtPriceCents: number, confirmedCount: number) {
  if (confirmedCount <= 0) return null;
  return Math.ceil(courtPriceCents / confirmedCount);
}

/** Valor congelado se a sessão foi fechada; senão, calculado ao vivo. */
export function sessionPricePerPerson(
  session: { courtPriceCents: number; finalPricePerPersonCents: number | null; status: string },
  confirmedCount: number,
) {
  if (session.status === "CLOSED" && session.finalPricePerPersonCents != null) {
    return session.finalPricePerPersonCents;
  }
  return pricePerPersonCents(session.courtPriceCents, confirmedCount);
}
