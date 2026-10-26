"use server";

import { revalidatePath } from "next/cache";
import { routing } from "@/i18n/routing";
import { grasEquilibre } from "@/lib/avec-gras";
import { LIMITES_REGLAGES } from "@/lib/reglages-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/session";

export type EtatReglage = {
  erreur?: string;
  ok?: string;
  attention?: string;
} | null;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UNITES = ["trajet", "nuit", "personne", "sejour"];
const ERREUR_GENERIQUE = "L'opération a échoué. Réessayez dans un instant.";

// Le site public est mis en cache : on le rafraîchit tout de suite
function rafraichir() {
  revalidatePath("/[locale]", "layout");
  revalidatePath("/admin/reglages");
}

// Un montant en FCFA : vide, valide (entier de 1 à 7 chiffres) ou invalide
function lireMontant(brut: FormDataEntryValue | null): {
  vide: boolean;
  valeur: number | null;
} {
  const s = String(brut ?? "").replace(/[\s\u00a0\u202f]/g, "");
  if (s === "") return { vide: true, valeur: null };
  if (!/^\d{1,7}$/.test(s)) return { vide: false, valeur: null };
  return { vide: false, valeur: Number(s) };
}

// Fusionne les textes saisis dans ceux déjà en base : une langue absente du formulaire
// n'est jamais touchée ; une langue du formulaire laissée vide est retirée.
function fusionner(
  existant: unknown,
  saisies: Record<string, string>,
): Record<string, string> {
  const base: Record<string, string> =
    existant && typeof existant === "object" && !Array.isArray(existant)
      ? { ...(existant as Record<string, string>) }
      : {};
  for (const [langue, texte] of Object.entries(saisies)) {
    if (texte) base[langue] = texte;
    else delete base[langue];
  }
  return base;
}

// ---------- Tarifs ----------

export async function enregistrerTarifs(
  _etat: EtatReglage,
  formData: FormData,
): Promise<EtatReglage> {
  await requireAdmin(); // toujours en premier : une action est une adresse publique

  const basse = lireMontant(formData.get("prix_basse")).valeur;
  const haute = lireMontant(formData.get("prix_haute")).valeur;
  const fetes = lireMontant(formData.get("prix_fetes")).valeur;
  if (
    basse === null ||
    haute === null ||
    fetes === null ||
    basse < 1 ||
    haute < 1 ||
    fetes < 1
  ) {
    return {
      erreur:
        "Indiquez les trois tarifs : des nombres entiers en FCFA, supérieurs à 0.",
    };
  }

  const afficher = formData.get("afficher_prix") === "on";

  try {
    const { data, error } = await createAdminClient()
      .from("site_settings")
      .update({
        prix_basse: basse,
        prix_haute: haute,
        prix_fetes: fetes,
        afficher_prix: afficher,
      })
      .eq("id", true)
      .select("id");
    if (error) {
      console.error("Admin : erreur lors de la modification des tarifs", error);
      return { erreur: ERREUR_GENERIQUE };
    }
    if (!data || data.length === 0) return { erreur: "Réglages introuvables." };
  } catch (e) {
    console.error("Admin : échec de la modification des tarifs", e);
    return { erreur: ERREUR_GENERIQUE };
  }

  rafraichir();
  return {
    ok: afficher
      ? "Tarifs enregistrés : ils sont affichés sur le site."
      : "Tarifs enregistrés. Ils restent masqués sur le site (« Nous consulter ») mais servent aux estimations.",
    attention:
      basse > haute || haute > fetes
        ? "Les tarifs ne sont pas dans l'ordre habituel (basse saison, puis haute saison, puis fêtes) : vérifiez-les."
        : undefined,
  };
}

// ---------- Conditions ----------

export async function enregistrerConditions(
  _etat: EtatReglage,
  formData: FormData,
): Promise<EtatReglage> {
  await requireAdmin();

  // Seules les langues actives sont lues : jamais de clé venue du formulaire
  const parLangue: Record<string, string[]> = {};
  for (const langue of routing.locales) {
    const lignes = String(formData.get(`conditions_${langue}`) ?? "")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lignes.length > LIMITES_REGLAGES.conditionsMax) {
      return {
        erreur: `Il y a trop de conditions (${LIMITES_REGLAGES.conditionsMax} au maximum).`,
      };
    }
    for (const [i, ligne] of lignes.entries()) {
      if (ligne.length > LIMITES_REGLAGES.conditionMax) {
        return {
          erreur: `La condition ${i + 1} est trop longue (${LIMITES_REGLAGES.conditionMax} caractères maximum).`,
        };
      }
      if (!grasEquilibre(ligne)) {
        return {
          erreur: `La condition ${i + 1} contient un nombre impair de « ** » : le gras est mal fermé.`,
        };
      }
    }
    parLangue[langue] = lignes;
  }

  const admin = createAdminClient();
  try {
    const { data: existant, error: erreurLecture } = await admin
      .from("site_settings")
      .select("conditions")
      .eq("id", true)
      .maybeSingle();
    if (erreurLecture) throw erreurLecture;
    if (!existant) return { erreur: "Réglages introuvables." };

    const conditions: Record<string, unknown> =
      existant.conditions &&
      typeof existant.conditions === "object" &&
      !Array.isArray(existant.conditions)
        ? { ...(existant.conditions as Record<string, unknown>) }
        : {};
    for (const [langue, lignes] of Object.entries(parLangue)) {
      if (lignes.length > 0) conditions[langue] = lignes;
      else delete conditions[langue];
    }

    const { data, error } = await admin
      .from("site_settings")
      .update({ conditions })
      .eq("id", true)
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) return { erreur: "Réglages introuvables." };
  } catch (e) {
    console.error("Admin : échec de la modification des conditions", e);
    return { erreur: ERREUR_GENERIQUE };
  }

  rafraichir();
  return { ok: "Conditions enregistrées : le site est à jour." };
}

// ---------- Services ----------

export async function enregistrerService(
  _etat: EtatReglage,
  formData: FormData,
): Promise<EtatReglage> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const creation = id === "";
  if (!creation && !UUID.test(id)) return { erreur: "Requête invalide." };

  // Noms : un champ par langue active ; la langue par défaut est obligatoire
  const noms: Record<string, string> = {};
  for (const langue of routing.locales) {
    const nom = String(formData.get(`nom_${langue}`) ?? "").trim();
    if (nom.length > LIMITES_REGLAGES.serviceNomMax) {
      return {
        erreur: `Le nom est trop long (${LIMITES_REGLAGES.serviceNomMax} caractères maximum).`,
      };
    }
    noms[langue] = nom;
  }
  if (!noms[routing.defaultLocale]) {
    return { erreur: "Indiquez le nom du service (en français)." };
  }

  const prix = lireMontant(formData.get("prix"));
  if (!prix.vide && (prix.valeur === null || prix.valeur < 1)) {
    return {
      erreur:
        "Prix invalide : un nombre entier en FCFA supérieur à 0, ou rien du tout pour « nous consulter ».",
    };
  }

  const unite = String(formData.get("unite") ?? "");
  if (unite !== "" && !UNITES.includes(unite)) {
    return { erreur: "Unité invalide." };
  }

  const actif = formData.get("actif") === "on";

  const ordreBrut = String(formData.get("ordre") ?? "").trim();
  if (ordreBrut !== "" && !/^\d{1,3}$/.test(ordreBrut)) {
    return {
      erreur: `L'ordre d'affichage doit être un nombre entre 0 et ${LIMITES_REGLAGES.ordreMax}.`,
    };
  }

  const admin = createAdminClient();

  try {
    if (creation) {
      const { data: existants, error: erreurLecture } = await admin
        .from("site_services")
        .select("ordre");
      if (erreurLecture) throw erreurLecture;
      if (existants.length >= LIMITES_REGLAGES.servicesMax) {
        return {
          erreur: `Il y a déjà ${LIMITES_REGLAGES.servicesMax} services : supprimez-en un avant d'en ajouter.`,
        };
      }
      const ordre =
        ordreBrut !== ""
          ? Number(ordreBrut)
          : Math.max(0, ...existants.map((s) => Number(s.ordre))) + 1;

      const { error } = await admin.from("site_services").insert({
        ordre,
        actif,
        nom: fusionner({}, noms),
        prix: prix.valeur,
        unite: unite || null,
      });
      if (error) throw error;
    } else {
      const { data: existant, error: erreurLecture } = await admin
        .from("site_services")
        .select("nom")
        .eq("id", id)
        .maybeSingle();
      if (erreurLecture) throw erreurLecture;
      if (!existant) return { erreur: "Service introuvable." };

      const modifs: Record<string, unknown> = {
        actif,
        nom: fusionner(existant.nom, noms),
        prix: prix.valeur,
        unite: unite || null,
      };
      if (ordreBrut !== "") modifs.ordre = Number(ordreBrut);

      const { data, error } = await admin
        .from("site_services")
        .update(modifs)
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) return { erreur: "Service introuvable." };
    }
  } catch (e) {
    console.error("Admin : échec de l'enregistrement d'un service", e);
    return { erreur: ERREUR_GENERIQUE };
  }

  rafraichir();
  return {
    ok: creation
      ? "Service ajouté : le site est à jour."
      : "Service enregistré : le site est à jour.",
  };
}

export async function supprimerService(
  _etat: EtatReglage,
  formData: FormData,
): Promise<EtatReglage> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return { erreur: "Requête invalide." };

  try {
    const { data, error } = await createAdminClient()
      .from("site_services")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) {
      return { erreur: "Ce service n'existe plus. Rechargez la page." };
    }
  } catch (e) {
    console.error("Admin : échec de la suppression d'un service", e);
    return { erreur: ERREUR_GENERIQUE };
  }

  rafraichir();
  return { ok: "Service supprimé." };
}