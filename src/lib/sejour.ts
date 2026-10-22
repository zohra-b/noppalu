// Règles d'un séjour : dates, durée, nombre de voyageurs.
// Fonctions pures (sans accès à la base) : valables côté serveur et côté navigateur.

export const REGLES = {
  nuitsMin: 2,
  nuitsMax: 14, // règle commerciale (protège aussi le serveur contre les dates absurdes)
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

// Années acceptées. Pendant que le visiteur tape l'année au clavier, le champ de date
// passe par des valeurs comme 0002 ou 0020 : elles ne doivent pas faire planter la page.
// (Date.UTC lit aussi les années 0 à 99 comme 1900 à 1999, ce qui faussait la vérification.)
const ANNEE_MIN = 2000;
const ANNEE_MAX = 2100;

// Renvoie l'instant UTC de minuit, ou null si la date est invalide, inexistante ou hors plage.
function lireDate(s: string): number | null {
  if (!FORMAT.test(s)) return null;
  const [a, m, j] = s.split("-").map(Number);
  if (a < ANNEE_MIN || a > ANNEE_MAX) return null;
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

/** Vrai si la chaîne est une vraie date AAAA-MM-JJ, avec une année entre 2000 et 2100. */
export function dateValide(s: string): boolean {
  return lireDate(s) !== null;
}

export type EtatDate = "vide" | "en_cours" | "invalide" | "ok";

/**
 * Situation d'un champ de date :
 * - "vide"     : rien de saisi ;
 * - "en_cours" : année à 1, 2 ou 3 chiffres (0002, 0020, 0202) : le visiteur est encore en train de taper ;
 * - "invalide" : saisie terminée mais impossible (1111, 2150, 20261…) ;
 * - "ok"       : date valide.
 */
export function etatDate(s: string): EtatDate {
  if (s === "") return "vide";
  if (dateValide(s)) return "ok";
  const annee = /^(\d+)-\d{2}-\d{2}$/.exec(s);
  if (annee && Number(annee[1]) < 1000) return "en_cours";
  return "invalide";
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