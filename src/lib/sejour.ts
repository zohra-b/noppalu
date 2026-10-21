// Règles d'un séjour : dates, durée, nombre de voyageurs.
// Fonctions pures (sans accès à la base) : valables côté serveur et côté navigateur.

export const REGLES = {
  nuitsMin: 2,
  nuitsMax: 14, 
  delaiMinJours: 1, // arrivée au plus tôt demain (24 h d'avance)
  horizonMois: 18, // même limite que le calendrier public
} as const;

export type CodeErreurSejour =
  | "dates_invalides"
  | "depart_avant_arrivee"
  | "arrivee_trop_proche"
  | "arrivee_trop_lointaine"
  | "sejour_trop_court"
  | "sejour_trop_long"
  | "voyageurs_invalides";

export type EntreeSejour = {
  arrivee: string; // AAAA-MM-JJ, première nuit
  depart: string; // AAAA-MM-JJ, jour du départ (exclusif)
  voyageurs: number;
  capacite: number; // capacité du studio demandé
};

const FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const MS_PAR_JOUR = 86_400_000;

// Renvoie l'instant UTC de minuit, ou null si la date est invalide ou inexistante.
function lireDate(s: string): number | null {
  if (!FORMAT.test(s)) return null;
  const [a, m, j] = s.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1, j));
  if (
    d.getUTCFullYear() !== a ||
    d.getUTCMonth() !== m - 1 ||
    d.getUTCDate() !== j
  ) {
    return null;
  }
  return d.getTime();
}

/** Date du jour au Sénégal (fuseau UTC toute l'année), au format AAAA-MM-JJ. */
export function aujourdhuiSenegal(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ajouterJours(date: string, n: number): string {
  const t = lireDate(date);
  if (t === null) throw new Error(`Date invalide : ${date}`);
  return new Date(t + n * MS_PAR_JOUR).toISOString().slice(0, 10);
}

function ajouterMois(date: string, n: number): string {
  const t = lireDate(date);
  if (t === null) throw new Error(`Date invalide : ${date}`);
  const d = new Date(t);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}

/** Nombre de nuits entre l'arrivée et le départ (0 si une date est invalide). */
export function nombreNuits(arrivee: string, depart: string): number {
  const a = lireDate(arrivee);
  const d = lireDate(depart);
  if (a === null || d === null) return 0;
  return Math.round((d - a) / MS_PAR_JOUR);
}

/** Renvoie un code d'erreur, ou null si le séjour respecte toutes les règles. */
export function validerSejour(
  e: EntreeSejour,
  aujourdhui: string = aujourdhuiSenegal(),
): CodeErreurSejour | null {
  const a = lireDate(e.arrivee);
  const d = lireDate(e.depart);
  if (a === null || d === null) return "dates_invalides";
  if (d <= a) return "depart_avant_arrivee";

  if (e.arrivee < ajouterJours(aujourdhui, REGLES.delaiMinJours)) {
    return "arrivee_trop_proche";
  }
  if (e.arrivee > ajouterMois(aujourdhui, REGLES.horizonMois)) {
    return "arrivee_trop_lointaine";
  }

  const nuits = nombreNuits(e.arrivee, e.depart);
  if (nuits < REGLES.nuitsMin) return "sejour_trop_court";
  if (nuits > REGLES.nuitsMax) return "sejour_trop_long";

  if (
    !Number.isInteger(e.voyageurs) ||
    e.voyageurs < 1 ||
    e.voyageurs > e.capacite
  ) {
    return "voyageurs_invalides";
  }
  return null;
}