import "server-only";
import type { Service } from "@/lib/data";
import type { Tarifs } from "@/lib/saisons";
import { createAdminClient } from "@/lib/supabase/admin";

export type ReglagesAdmin = {
  tarifs: Tarifs;
  afficherPrix: boolean;
  annonce: Record<string, string>;
  conditions: Record<string, string[]>;
  services: Service[]; // y compris les services masqués
};

/** Réglages complets pour l'administration (la lecture publique, elle, ne renvoie que les services actifs). */
export async function getReglagesAdmin(): Promise<ReglagesAdmin> {
  const admin = createAdminClient();

  const [reglages, services] = await Promise.all([
    admin
      .from("site_settings")
      .select(
        "prix_basse, prix_haute, prix_fetes, conditions, afficher_prix, annonce_tarifs",
      )
      .single(),
    admin
      .from("site_services")
      .select("id, ordre, actif, nom, prix, unite")
      .order("ordre", { ascending: true }),
  ]);

  if (reglages.error) {
    throw new Error(`Lecture des réglages impossible : ${reglages.error.message}`);
  }
  if (services.error) {
    throw new Error(`Lecture des services impossible : ${services.error.message}`);
  }

  return {
    tarifs: {
      basse: reglages.data.prix_basse,
      haute: reglages.data.prix_haute,
      fetes: reglages.data.prix_fetes,
    },
    afficherPrix: reglages.data.afficher_prix,
    annonce: (reglages.data.annonce_tarifs ?? {}) as Record<string, string>,
    conditions: (reglages.data.conditions ?? {}) as Record<string, string[]>,
    services: services.data as Service[],
  };
}