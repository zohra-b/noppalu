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