export type SaisonCle = "basse" | "haute" | "fetes";

export type Tarifs = Record<SaisonCle, number>;

export type JourMois = { jour: number; mois: number };

/**
 * Source unique des périodes de saison (jour et mois, sans année).
 * - "fetes" est prioritaire sur "haute" et chevauche deux années.
 * - Les bornes sont des NUITS : la nuit du 5 janvier (départ le 6) est
 *   encore au tarif des fêtes.
 * - "basse" : juin à octobre. "haute" : tout le reste.
 */
export const PERIODES = {
  fetes: { debut: { jour: 15, mois: 12 }, fin: { jour: 14, mois: 1 } },
  basse: { debut: { jour: 1, mois: 6 }, fin: { jour: 31, mois: 10 } },
  haute: { debut: { jour: 1, mois: 11 }, fin: { jour: 31, mois: 5 } },
} as const satisfies Record<SaisonCle, { debut: JourMois; fin: JourMois }>;

const FORMAT_NUIT = /^\d{4}-\d{2}-\d{2}$/;

function lireNuit(nuit: string): { mois: number; jour: number } {
  if (!FORMAT_NUIT.test(nuit)) {
    throw new Error(`Nuit invalide (attendu AAAA-MM-JJ) : ${nuit}`);
  }
  const [annee, mois, jour] = nuit.split("-").map(Number);
  const controle = new Date(Date.UTC(annee, mois - 1, jour));
  if (
    controle.getUTCFullYear() !== annee ||
    controle.getUTCMonth() !== mois - 1 ||
    controle.getUTCDate() !== jour
  ) {
    throw new Error(`Date inexistante : ${nuit}`);
  }
  return { mois, jour };
}

/** Saison applicable à une nuit (date de début de la nuit). */
export function saisonDeLaNuit(nuit: string): SaisonCle {
  const { mois, jour } = lireNuit(nuit);

  const { debut, fin } = PERIODES.fetes;
  const enFetes =
    (mois === debut.mois && jour >= debut.jour) ||
    (mois === fin.mois && jour <= fin.jour);
  if (enFetes) return "fetes";

  if (mois >= PERIODES.basse.debut.mois && mois <= PERIODES.basse.fin.mois) {
    return "basse";
  }
  return "haute";
}

/** Prix d'une nuit. Les prix viennent de site_settings. */
export function prixDeLaNuit(nuit: string, tarifs: Tarifs): number {
  return tarifs[saisonDeLaNuit(nuit)];
}

/**
 * Prix d'un séjour = somme des prix de chaque nuit.
 * `depart` est exclusif (jour du départ), comme end_date en base.
 */
export function prixDuSejour(
  arrivee: string,
  depart: string,
  tarifs: Tarifs
): number {
  lireNuit(arrivee);
  lireNuit(depart);
  if (depart <= arrivee) {
    throw new Error("La date de départ doit suivre la date d'arrivée.");
  }
  const [a, m, j] = arrivee.split("-").map(Number);
  const curseur = new Date(Date.UTC(a, m - 1, j));
  const fin = new Date(`${depart}T00:00:00Z`);
  let total = 0;
  while (curseur < fin) {
    total += prixDeLaNuit(curseur.toISOString().slice(0, 10), tarifs);
    curseur.setUTCDate(curseur.getUTCDate() + 1);
  }
  return total;
}

/** Formate un jour/mois pour les libellés (ex. « 15 décembre »). */
export function formaterJourMois(jm: JourMois, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, jm.mois - 1, jm.jour)));
}