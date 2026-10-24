import { ajouterJours, dateValide, nombreNuits } from "@/lib/sejour";
// Types et libellés partagés (utilisables côté serveur et côté navigateur)

export type SourceBlocage =
  | "demande_site"
  | "airbnb"
  | "booking"
  | "manuel"
  | "indisponible";

export type Blocage = {
  id: string;
  studioSlug: string;
  debut: string; // première nuit (AAAA-MM-JJ)
  fin: string; // jour du départ, exclusif
  source: SourceBlocage;
  nom: string | null;
  note: string | null;
  email: string | null;
  telephone: string | null;
  demandeId: string | null; // demande du site à l'origine du blocage
};

export const SOURCES: SourceBlocage[] = [
  "demande_site",
  "airbnb",
  "booking",
  "manuel",
  "indisponible",
];

export const LIBELLES_SOURCE: Record<string, string> = {
  demande_site: "Demande du site",
  airbnb: "Airbnb",
  booking: "Booking.com",
  manuel: "Réservation directe",
  indisponible: "Indisponible",
};

export const CLASSES_SOURCE: Record<SourceBlocage, string> = {
  demande_site: "bg-[#0BB324]",
  airbnb: "bg-[#EA0F65]",
  booking: "bg-[#3AC7CC]",
  manuel: "bg-[#C6B06B]",
  indisponible: "bg-gray-800",
};

// --- Gestion à la main des blocages (admin) ---

// Les blocages venus d'une demande du site se gèrent depuis la demande
export const SOURCES_MODIFIABLES: SourceBlocage[] = [
  "airbnb",
  "booking",
  "manuel",
  "indisponible",
];

export function estModifiable(
  b: Pick<Blocage, "source" | "demandeId">,
): boolean {
  return b.source !== "demande_site" && b.demandeId === null;
}

export const BLOCAGE = {
  nuitsMax: 366,
  passeJours: 366, // arrivée au plus tôt il y a un an
  futurJours: 730, // arrivée au plus tard dans deux ans
} as const;

export type CodeErreurBlocage =
  | "dates_invalides"
  | "depart_avant_arrivee"
  | "arrivee_hors_plage"
  | "bloc_trop_long";

export const MESSAGES_BLOCAGE: Record<CodeErreurBlocage, string> = {
  dates_invalides: "Date invalide : vérifiez le jour, le mois et l'année.",
  depart_avant_arrivee: "La date de départ doit être après la date d'arrivée.",
  arrivee_hors_plage:
    "L'arrivée doit se situer entre un an dans le passé et deux ans dans le futur.",
  bloc_trop_long: `Un blocage ne peut pas dépasser ${BLOCAGE.nuitsMax} nuits.`,
};

/** Renvoie un code d'erreur, ou null si les dates conviennent. Utilisable côté serveur et navigateur. */
export function validerBlocage(
  debut: string,
  fin: string,
  aujourdhui: string,
): CodeErreurBlocage | null {
  if (!dateValide(debut) || !dateValide(fin)) return "dates_invalides";
  if (fin <= debut) return "depart_avant_arrivee";
  if (
    debut < ajouterJours(aujourdhui, -BLOCAGE.passeJours) ||
    debut > ajouterJours(aujourdhui, BLOCAGE.futurJours)
  ) {
    return "arrivee_hors_plage";
  }
  if (nombreNuits(debut, fin) > BLOCAGE.nuitsMax) return "bloc_trop_long";
  return null;
};