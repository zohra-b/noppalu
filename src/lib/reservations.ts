import { LIBELLES_SOURCE, type Blocage } from "@/lib/blocages-types";
import {
  delaiDepasse,
  type Demande,
  type StatutDemande,
} from "@/lib/demandes";
import { LIBELLES_ORIGINE } from "@/lib/reservations-types";
import { nombreNuits } from "@/lib/sejour";

// Une ligne de la liste : une réservation (demande) ou un blocage sans réservation

export type LigneReservation = {
  cle: string;
  demandeId: string | null; // null = blocage sans réservation
  studio: string;
  arrivee: string;
  depart: string;
  nuits: number;
  client: string | null;
  origine: string;
  statut: StatutDemande | null; // null = blocage simple
  enRetard: boolean;
  montant: number | null;
};

export type CleFiltre =
  | "a-traiter"
  | "a-encaisser"
  | "a-venir"
  | "terminees"
  | "toutes";

export const FILTRES: { cle: CleFiltre; libelle: string }[] = [
  { cle: "a-traiter", libelle: "À traiter" },
  { cle: "a-encaisser", libelle: "À encaisser" },
  { cle: "a-venir", libelle: "À venir" },
  { cle: "terminees", libelle: "Terminées" },
  { cle: "toutes", libelle: "Toutes" },
];

export function construireLignes(
  demandes: Demande[],
  blocages: Blocage[],
  noms: Map<string, string>,
): LigneReservation[] {
  const nom = (slug: string) => noms.get(slug) ?? slug;

  const reservations: LigneReservation[] = demandes.map((d) => ({
    cle: `r-${d.id}`,
    demandeId: d.id,
    studio: nom(d.studioSlug),
    arrivee: d.arrivee,
    depart: d.depart,
    nuits: nombreNuits(d.arrivee, d.depart),
    client: d.nom,
    origine: LIBELLES_ORIGINE[d.origine],
    statut: d.statut,
    enRetard: delaiDepasse(d),
    montant: d.estimation,
  }));

  const blocagesSeuls: LigneReservation[] = blocages
    .filter((b) => b.demandeId === null)
    .map((b) => ({
      cle: `b-${b.id}`,
      demandeId: null,
      studio: nom(b.studioSlug),
      arrivee: b.debut,
      depart: b.fin,
      nuits: nombreNuits(b.debut, b.fin),
      client: b.nom,
      origine:
        b.source === "demande_site"
          ? "Demande supprimée"
          : (LIBELLES_SOURCE[b.source] ?? b.source),
      statut: null,
      enRetard: false,
      montant: null,
    }));

  return [...reservations, ...blocagesSeuls];
}

export function correspond(
  l: LigneReservation,
  cle: CleFiltre,
  aujourdhui: string,
): boolean {
  const s = l.statut;
  switch (cle) {
    case "a-traiter":
      return s === "nouvelle";
    case "a-encaisser":
      return s === "acceptee" || s === "en_attente_paiement";
    case "a-venir":
      return (
        (s === null ||
          s === "acceptee" ||
          s === "en_attente_paiement" ||
          s === "payee") &&
        l.depart >= aujourdhui
      );
    case "terminees":
      return (
        s === "refusee" ||
        s === "expiree" ||
        ((s === null || s === "payee") && l.depart < aujourdhui)
      );
    case "toutes":
      return true;
  }
}

/** Arrivée la plus proche d'abord pour ce qui est à faire ou à venir, la plus récente d'abord pour le reste. */
export function trier(
  lignes: LigneReservation[],
  cle: CleFiltre,
): LigneReservation[] {
  const croissant =
    cle === "a-traiter" || cle === "a-encaisser" || cle === "a-venir";
  const comparer = (a: LigneReservation, b: LigneReservation) => {
    const c =
      a.arrivee < b.arrivee
        ? -1
        : a.arrivee > b.arrivee
          ? 1
          : a.depart < b.depart
            ? -1
            : a.depart > b.depart
              ? 1
              : 0;
    return croissant ? c : -c;
  };
  return [...lignes].sort(comparer);
}

/** Ce qu'on affiche d'abord : ce qui est à faire, sinon ce qui est à venir. */
export function filtreParDefaut(
  lignes: LigneReservation[],
  aujourdhui: string,
): CleFiltre {
  if (lignes.some((l) => correspond(l, "a-traiter", aujourdhui))) {
    return "a-traiter";
  }
  if (lignes.some((l) => correspond(l, "a-encaisser", aujourdhui))) {
    return "a-encaisser";
  }
  return "a-venir";
}