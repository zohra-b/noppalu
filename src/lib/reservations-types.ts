import type { SourceBlocage } from "@/lib/blocages-types";

// Types et libellés partagés (utilisables côté serveur et côté navigateur)

export type OrigineDemande = "site" | "direct" | "booking" | "airbnb";

export type MoyenPaiement = "wave" | "virement" | "paypal" | "especes" | "autre";

// Origines qu'on peut créer à la main dans l'admin (les demandes du site arrivent toutes seules)
export const ORIGINES_CREATION: OrigineDemande[] = ["direct", "booking", "airbnb"];

export const LIBELLES_ORIGINE: Record<OrigineDemande, string> = {
  site: "Site",
  direct: "Réservation directe",
  booking: "Booking.com",
  airbnb: "Airbnb",
};

export const MOYENS_PAIEMENT: MoyenPaiement[] = [
  "wave",
  "virement",
  "paypal",
  "especes",
  "autre",
];

export const LIBELLES_PAIEMENT: Record<MoyenPaiement, string> = {
  wave: "Wave",
  virement: "Virement bancaire",
  paypal: "PayPal",
  especes: "Espèces",
  autre: "Autre",
};

/** Booking.com et Airbnb : la plateforme gère déjà la relation avec le client. */
export function estPlateforme(origine: OrigineDemande): boolean {
  return origine === "booking" || origine === "airbnb";
}

/**
 * E-mail de confirmation envoyé automatiquement au clic sur « Paiement reçu » :
 * demandes du site et réservations directes, à condition d'avoir l'adresse du client.
 */
export function confirmationAutomatique(
  origine: OrigineDemande,
  email: string | null,
): boolean {
  return !estPlateforme(origine) && email !== null && email.trim() !== "";
}

/** Le délai de paiement de 72 h concerne les demandes du site et les réservations directes. */
export function aDelaiPaiement(origine: OrigineDemande): boolean {
  return !estPlateforme(origine);
}

/** Origine d'une réservation -> origine du blocage de dates correspondant (cf. creer_reservation). */
export function sourceDeOrigine(origine: OrigineDemande): SourceBlocage {
  switch (origine) {
    case "site":
      return "demande_site";
    case "direct":
      return "manuel";
    case "booking":
      return "booking";
    case "airbnb":
      return "airbnb";
  }
}