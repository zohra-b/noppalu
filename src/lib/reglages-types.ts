import type { UniteService } from "@/lib/data";

// Constantes partagées entre les formulaires (navigateur) et l'enregistrement (serveur)

export const UNITES: { code: UniteService; libelle: string }[] = [
  { code: "trajet", libelle: "par trajet" },
  { code: "nuit", libelle: "par nuit" },
  { code: "personne", libelle: "par personne" },
  { code: "sejour", libelle: "par séjour" },
];

export const LIMITES_REGLAGES = {
  prixMax: 9_999_999, // 7 chiffres
  conditionsMax: 20,
  conditionMax: 500,
  annonceMax: 500,
  serviceNomMax: 100,
  servicesMax: 30,
  ordreMax: 999,
} as const;