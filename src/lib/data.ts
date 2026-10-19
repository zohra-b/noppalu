//lecture des données depuis Supabase
import { createPublicClient } from "@/lib/supabase/server";
import type { Tarifs } from "@/lib/saisons";

export type EquipementCode = "clim" | "wifi" | "tv" | "piscine" | "cuisine";

export type Bungalow = {
  slug: string;
  nom: string;
  ordre: number;
  publie: boolean;
  capacite: number;
  litCm: number;
  equipements: EquipementCode[];
  resume: Record<string, string>;
  description: Record<string, string>;
};

export type Reglages = {
  tarifs: Tarifs;
  prixTransfert: number;
  conditions: Record<string, string[]>;
};

type LigneBungalow = {
  slug: string;
  nom: string;
  ordre: number;
  publie: boolean;
  capacite: number;
  lit_cm: number;
  equipements: EquipementCode[];
  resume: Record<string, string>;
  description: Record<string, string>;
};

function versBungalow(l: LigneBungalow): Bungalow {
  return {
    slug: l.slug,
    nom: l.nom,
    ordre: l.ordre,
    publie: l.publie,
    capacite: l.capacite,
    litCm: l.lit_cm,
    equipements: l.equipements,
    resume: l.resume,
    description: l.description,
  };
}

const COLONNES =
  "slug, nom, ordre, publie, capacite, lit_cm, equipements, resume, description";

/**
 * Bungalows visibles du public, dans l'ordre d'affichage.
 * La RLS ne renvoie de toute façon que les bungalows publiés.
 */
export async function getBungalows(): Promise<Bungalow[]> {
  const { data, error } = await createPublicClient()
    .from("bungalows")
    .select(COLONNES)
    .order("ordre", { ascending: true });

  if (error) throw new Error(`Lecture des bungalows impossible : ${error.message}`);
  return (data as LigneBungalow[]).map(versBungalow);
}

/** Un bungalow par slug, ou null s'il n'existe pas ou n'est pas publié. */
export async function getBungalow(slug: string): Promise<Bungalow | null> {
  const { data, error } = await createPublicClient()
    .from("bungalows")
    .select(COLONNES)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Lecture du bungalow impossible : ${error.message}`);
  return data ? versBungalow(data as LigneBungalow) : null;
}

/** Tarifs, prix du transfert et conditions. */
export async function getReglages(): Promise<Reglages> {
  const { data, error } = await createPublicClient()
    .from("site_settings")
    .select("prix_basse, prix_haute, prix_fetes, prix_transfert, conditions")
    .single();

  if (error) throw new Error(`Lecture des réglages impossible : ${error.message}`);
  return {
    tarifs: {
      basse: data.prix_basse,
      haute: data.prix_haute,
      fetes: data.prix_fetes,
    },
    prixTransfert: data.prix_transfert,
    conditions: data.conditions as Record<string, string[]>,
  };
}

/** Texte dans la langue demandée, avec repli sur le français. */
export function texteLocalise<T>(
  valeurs: Record<string, T> | undefined,
  locale: string
): T | undefined {
  return valeurs?.[locale] ?? valeurs?.fr;
}