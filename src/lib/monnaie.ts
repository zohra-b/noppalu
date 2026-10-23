// Le franc CFA (XOF) est arrimé à l'euro à parité fixe.
export const FCFA_PAR_EURO = 655.957;

/** Montant en euros, arrondi au centime. */
export function enEuros(fcfa: number): number {
  return Math.round((fcfa / FCFA_PAR_EURO) * 100) / 100;
}

export function formaterFcfa(n: number, locale = "fr"): string {
  return `${new Intl.NumberFormat(locale).format(n)} FCFA`;
}

export function formaterEuros(euros: number, locale = "fr"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(euros);
}

/** « 120 000 FCFA (182,94 €) » */
export function formaterMontantDouble(fcfa: number, locale = "fr"): string {
  return `${formaterFcfa(fcfa, locale)} (${formaterEuros(enEuros(fcfa), locale)})`;
}