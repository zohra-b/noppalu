import type { EquipementCode } from "@/lib/data";

// Constantes partagées entre la page de réglages (navigateur) et l'enregistrement (serveur)

export const EQUIPEMENTS: { code: EquipementCode; libelle: string }[] = [
  { code: "clim", libelle: "Climatisation" },
  { code: "wifi", libelle: "Wi-Fi" },
  { code: "tv", libelle: "Télévision connectée" },
  { code: "piscine", libelle: "Accès à la piscine et au jardin" },
  { code: "cuisine", libelle: "Kitchenette" },
];

export const LIMITES_STUDIO = {
  nomMax: 60,
  resumeMax: 300,
  descriptionMax: 3000,
  capaciteMin: 1,
  capaciteMax: 20, // limite de la base
  litMin: 80, // limites de la base
  litMax: 250,
} as const;

export const NOMS_LANGUES: Record<string, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
};