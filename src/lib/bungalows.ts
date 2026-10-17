export type Photo = { src: string; alt: string };

export type IconeNom = "lit" | "clim" | "cuisine" | "wifi" | "tv" | "piscine";

export type Equipement = { icone: IconeNom; libelle: string };

export type Bungalow = {
  slug: string;
  nom: string;
  resume: string;
  publie: boolean;
  lit: string; // propre à chaque bungalow
  photos: Photo[];
  description?: string;
};

export const infosCommunes = {
  equipements: [
    { icone: "clim", libelle: "Climatisation" },
    { icone: "wifi", libelle: "Wi-Fi" },
    { icone: "tv", libelle: "Télévision connectée" },
    { icone: "piscine", libelle: "Accès à la piscine et au jardin" },
    {
      icone: "cuisine",
      libelle: "Kitchenette (petit réfrigérateur, plaques de cuisson, micro-ondes, machine à café, bouilloire)",
    },
  ] as Equipement[],
  conditions: [
    "Accès au logement : à partir de 14h. Sortie du logement : 11h. (service de bagagerie offert)",
    "Séjour minimum : 2 nuits. Réservation : minimum 24h avant.",
    "Paiement : virement, Wave, Paypal",
    
  ],
};

export const bungalows: Bungalow[] = [
  {
    slug: "manguier",
    nom: "Manguier",
    resume: "",
    publie: true,
    lit: "160 cm",
    photos: [{ src: "/images/bungalow1.jpg", alt: "Bungalow Manguier" }, { src: "/images/bungalow2.jpg", alt: "Bungalow Bananier" }, ],
  },
  {
    slug: "cocotier",
    nom: "Cocotier",
    resume: "",
    publie: false,
    lit: "160 cm",
    photos: [{ src: "/images/bungalow2.jpg", alt: "Bungalow Cocotier" }],
  },
  {
    slug: "bananier",
    nom: "Bananier",
    resume: "",
    publie: false,
    lit: "140 cm",
    photos: [{ src: "/images/bungalow3.jpg", alt: "Bungalow Bananier" }],
  },
];

export function getBungalow(slug: string) {
  return bungalows.find((b) => b.slug === slug);
}