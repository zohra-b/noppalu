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

export type UniteService = "trajet" | "nuit" | "personne" | "sejour";

export type Service = {
  id: string;
  ordre: number;
  actif: boolean;
  nom: Record<string, string>;
  prix: number | null; // null = « nous consulter »
  unite: UniteService | null;
};

export type Reglages = {
  tarifs: Tarifs;
  conditions: Record<string, string[]>;
  afficherPrix: boolean;
  services: Service[];
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
 * Tous les bungalows, dans l'ordre d'affichage (publiés ou non).
 * C'est à l'appelant (la page qui apelle la vue) de filtrer sur `publie` quand c'est nécessaire.
 */
export async function getBungalows(): Promise<Bungalow[]> {
  const { data, error } = await createPublicClient()
    .from("bungalows")
    .select(COLONNES)
    .order("ordre", { ascending: true });

  if (error) throw new Error(`Lecture des bungalows impossible : ${error.message}`);
  return (data as LigneBungalow[]).map(versBungalow);
}

/** Un bungalow par slug, ou null s'il n'existe pas. Vérifier `publie` avant d'afficher sa page. */
export async function getBungalow(slug: string): Promise<Bungalow | null> {
  const { data, error } = await createPublicClient()
    .from("bungalows")
    .select(COLONNES)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Lecture du bungalow impossible : ${error.message}`);
  return data ? versBungalow(data as LigneBungalow) : null;
}

/** Services proposés (transfert, petit-déjeuner…), dans l'ordre d'affichage. La base ne renvoie que les actifs. */
export async function getServices(): Promise<Service[]> {
  const { data, error } = await createPublicClient()
    .from("site_services")
    .select("id, ordre, actif, nom, prix, unite")
    .eq("actif", true)
    .order("ordre", { ascending: true });

  if (error) throw new Error(`Lecture des services impossible : ${error.message}`);
  return data as Service[];
}

/** Tarifs, conditions, services et réglage d'affichage des prix. */
export async function getReglages(): Promise<Reglages> {
  const [reponse, services] = await Promise.all([
    createPublicClient()
      .from("site_settings")
      .select("prix_basse, prix_haute, prix_fetes, conditions, afficher_prix")
      .single(),
    // Les services sont facultatifs : si leur lecture échoue, le reste du site continue de s'afficher
    getServices().catch((e) => {
      console.error("Lecture des services impossible", e);
      return [] as Service[];
    }),
  ]);

  const { data, error } = reponse;
  if (error) throw new Error(`Lecture des réglages impossible : ${error.message}`);

  return {
    tarifs: {
      basse: data.prix_basse,
      haute: data.prix_haute,
      fetes: data.prix_fetes,
    },
    conditions: data.conditions as Record<string, string[]>,
    afficherPrix: data.afficher_prix,
    services,
  };
}

/** Texte dans la langue demandée, avec repli sur le français. */
export function texteLocalise<T>(
  valeurs: Record<string, T> | undefined,
  locale: string
): T | undefined {
  return valeurs?.[locale] ?? valeurs?.fr;
}

export type Periode = { debut: string; fin: string }; // fin exclusive (jour du départ)

/**
 * Périodes occupées d'un bungalow publié (dates uniquement, aucune donnée privée).
 * Lit la vue `availability_public`. Les périodes déjà terminées sont ignorées.
 */
export async function getIndisponibilites(slug: string): Promise<Periode[]> {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const { data, error } = await createPublicClient()
    .from("availability_public")
    .select("start_date, end_date")
    .eq("bungalow_slug", slug)
    .gte("end_date", aujourdhui)
    .order("start_date", { ascending: true });

  if (error) {
    throw new Error(`Lecture des disponibilités impossible : ${error.message}`);
  }
  return (data as { start_date: string; end_date: string }[]).map((l) => ({
    debut: l.start_date,
    fin: l.end_date,
  }));
}
  /**
 * Périodes occupées de tous les studios publiés, regroupées par studio
 * (dates uniquement). Les périodes déjà terminées sont ignorées.
 */
export async function getToutesIndisponibilites(): Promise<
  Record<string, Periode[]>
> {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const { data, error } = await createPublicClient()
    .from("availability_public")
    .select("bungalow_slug, start_date, end_date")
    .gte("end_date", aujourdhui)
    .order("start_date", { ascending: true });

  if (error) {
    throw new Error(`Lecture des disponibilités impossible : ${error.message}`);
  }

  const parStudio: Record<string, Periode[]> = {};
  for (const l of data as {
    bungalow_slug: string;
    start_date: string;
    end_date: string;
  }[]) {
    (parStudio[l.bungalow_slug] ??= []).push({
      debut: l.start_date,
      fin: l.end_date,
    });
  }
  return parStudio;
}

/**
 * Studios publiés libres pendant TOUT le séjour (arrivée incluse, départ exclu).
 * Une période occupée gêne le séjour si elle commence avant le départ
 * et se termine après l'arrivée : un départ le jour de notre arrivée,
 * ou une arrivée le jour de notre départ, ne gênent pas.
 */
export async function getStudiosLibres(
  arrivee: string,
  depart: string
): Promise<Bungalow[]> {
  const [studios, occupes] = await Promise.all([
    getBungalows(),
    createPublicClient()
      .from("availability_public")
      .select("bungalow_slug")
      .lt("start_date", depart)
      .gt("end_date", arrivee),
  ]);

  if (occupes.error) {
    throw new Error(
      `Lecture des disponibilités impossible : ${occupes.error.message}`
    );
  }

  const pris = new Set(
    (occupes.data as { bungalow_slug: string }[]).map((l) => l.bungalow_slug)
  );
  return studios.filter((s) => s.publie && !pris.has(s.slug));
} 