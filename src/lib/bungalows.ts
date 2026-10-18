export type IconeNom = "lit" | "clim" | "cuisine" | "wifi" | "tv" | "piscine";

// `valeur` sert au lit (ex. "160 cm"), propre à chaque bungalow
export type Equipement = { icone: IconeNom; valeur?: string };

export type TarifCle = "basse" | "haute" | "fetes";
export type LigneTarif = { cle: TarifCle; prix: number };

export type ConditionCle = "capacite" | "sejour" | "horaires" | "paiement";

export type Bungalow = {
  slug: string;
  nom: string;
  publie: boolean;
  lit: string;
  photos: string[];
};

export const infosCommunes = {
  equipements: [
    { icone: "clim" },
    { icone: "wifi" },
    { icone: "tv" },
    { icone: "piscine" },
    { icone: "cuisine" },
  ] as Equipement[],
  tarifs: [
    { cle: "basse", prix: 35000 },
    { cle: "haute", prix: 40000 },
    { cle: "fetes", prix: 50000 },
  ] as LigneTarif[],
  transfertAeroport: 20000,
  conditions: ["capacite", "sejour", "horaires", "paiement"] as ConditionCle[],
};

export const bungalows: Bungalow[] = [
  {
    slug: "manguier",
    nom: "Manguier",
    publie: false,
    lit: "160 cm",
    photos: ["/images/bungalow1.jpg", "/images/bungalow2.jpg"],
  },
  {
    slug: "cocotier",
    nom: "Cocotier",
    publie: false,
    lit: "160 cm",
    photos: ["/images/bungalow2.jpg"],
  },
  {
    slug: "bananier",
    nom: "Bananier",
    publie: false,
    lit: "140 cm",
    photos: ["/images/bungalow3.jpg"],
  },
];

export function getBungalow(slug: string) {
  return bungalows.find((b) => b.slug === slug);
}