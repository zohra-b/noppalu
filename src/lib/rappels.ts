import type { Demande } from "@/lib/demandes";
import { ajouterJours } from "@/lib/sejour";

/** Nombre de jours d'avance pour le rappel d'arrivée. */
export const RAPPEL_JOURS = 2;

/** Réservations acceptées ou payées qui arrivent aujourd'hui ou dans les prochains jours, par arrivée croissante. */
export function arriveesProches(
  demandes: Demande[],
  aujourdhui: string,
  jours: number = RAPPEL_JOURS,
): Demande[] {
  const limite = ajouterJours(aujourdhui, jours);
  return demandes
    .filter(
      (d) =>
        (d.statut === "acceptee" ||
          d.statut === "en_attente_paiement" ||
          d.statut === "payee") &&
        d.arrivee >= aujourdhui &&
        d.arrivee <= limite,
    )
    .sort((a, b) => (a.arrivee < b.arrivee ? -1 : a.arrivee > b.arrivee ? 1 : 0));
}