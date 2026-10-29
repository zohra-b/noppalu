"use server";

import { revalidatePath } from "next/cache";
import { routing } from "@/i18n/routing";
import type { EquipementCode } from "@/lib/data";
import { photosDe } from "@/lib/photos";
import { aujourdhuiSenegal } from "@/lib/sejour";
import { EQUIPEMENTS, LIMITES_STUDIO } from "@/lib/studios-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/session";

export type EtatStudio = {
  erreur?: string;
  ok?: string;
  attention?: string;
} | null;

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function entier(brut: FormDataEntryValue | null): number | null {
  const s = String(brut ?? "").trim();
  return /^\d{1,4}$/.test(s) ? Number(s) : null;
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

export async function modifierStudio(
  _etat: EtatStudio,
  formData: FormData,
): Promise<EtatStudio> {
  await requireAdmin(); // toujours en premier : une action est une adresse publique

  const slug = String(formData.get("slug") ?? "");
  if (!SLUG.test(slug)) return { erreur: "Requête invalide." };

  const nom = String(formData.get("nom") ?? "").trim();
  if (nom.length < 1 || nom.length > LIMITES_STUDIO.nomMax) {
    return {
      erreur: `Le nom doit contenir de 1 à ${LIMITES_STUDIO.nomMax} caractères.`,
    };
  }

  const publie = formData.get("publie") === "on";

  const capacite = entier(formData.get("capacite"));
  if (
    capacite === null ||
    capacite < LIMITES_STUDIO.capaciteMin ||
    capacite > LIMITES_STUDIO.capaciteMax
  ) {
    return {
      erreur: `La capacité doit être comprise entre ${LIMITES_STUDIO.capaciteMin} et ${LIMITES_STUDIO.capaciteMax}.`,
    };
  }

  const lit = entier(formData.get("lit"));
  if (lit === null || lit < LIMITES_STUDIO.litMin || lit > LIMITES_STUDIO.litMax) {
    return {
      erreur: `La largeur du lit doit être comprise entre ${LIMITES_STUDIO.litMin} et ${LIMITES_STUDIO.litMax} cm.`,
    };
  }

  const codes = EQUIPEMENTS.map((e) => e.code) as string[];
  const equipements = [
    ...new Set(formData.getAll("equipements").map(String)),
  ].filter((c) => codes.includes(c)) as EquipementCode[];

  // Seules les langues actives sont lues : jamais de clé venue du formulaire
  const resumes: Record<string, string> = {};
  const descriptions: Record<string, string> = {};
  for (const langue of routing.locales) {
    const resume = String(formData.get(`resume_${langue}`) ?? "")
      .replace(/\r\n/g, "\n")
      .trim();
    const description = String(formData.get(`description_${langue}`) ?? "")
      .replace(/\r\n/g, "\n")
      .trim();
    if (resume.length > LIMITES_STUDIO.resumeMax) {
      return {
        erreur: `Le résumé est trop long (${LIMITES_STUDIO.resumeMax} caractères maximum).`,
      };
    }
    if (description.length > LIMITES_STUDIO.descriptionMax) {
      return {
        erreur: `La description est trop longue (${LIMITES_STUDIO.descriptionMax} caractères maximum).`,
      };
    }
    resumes[langue] = resume;
    descriptions[langue] = description;
  }

  const admin = createAdminClient();
  let attention = "";

  try {
    const { data: existant, error: erreurLecture } = await admin
      .from("bungalows")
      .select("publie, resume, description")
      .eq("slug", slug)
      .maybeSingle();
    if (erreurLecture) throw erreurLecture;
    if (!existant) return { erreur: "Studio introuvable." };

    const resumeFinal = fusionner(existant.resume, resumes);

    const { data, error } = await admin
      .from("bungalows")
      .update({
        nom,
        publie,
        capacite,
        lit_cm: lit,
        equipements,
        resume: resumeFinal,
        description: fusionner(existant.description, descriptions),
      })
      .eq("slug", slug)
      .select("slug");
    if (error) {
      console.error("Admin : erreur lors de la modification d'un studio", error);
      return {
        erreur:
          error.code === "23514"
            ? "Une des valeurs est refusée par la base (capacité, lit ou équipements)."
            : "L'opération a échoué. Réessayez dans un instant.",
      };
    }
    if (!data || data.length === 0) return { erreur: "Studio introuvable." };

    // Rappels utiles, sans bloquer l'enregistrement
    const notes: string[] = [];
    if (existant.publie && !publie) {
      const { count } = await admin
        .from("availability_blocks")
        .select("id", { count: "exact", head: true })
        .eq("bungalow_slug", slug)
        .gte("end_date", aujourdhuiSenegal());
      notes.push(
        count
          ? `Ce studio est masqué alors qu'il a ${count} blocage${count > 1 ? "s" : ""} de dates à venir : les réservations sont conservées, mais plus personne ne peut le demander sur le site.`
          : "Ce studio est masqué : sa page n'est plus accessible et il n'est plus proposé à la réservation. Sa carte reste sur la page Studios avec « Bientôt disponible ».",
      );
    }
    if (publie && photosDe(slug).length === 0) {
      notes.push(
        "Aucune photo n'est configurée pour ce studio (fichier src/lib/photos.ts).",
      );
    }
    if (publie && !resumeFinal.fr) {
      notes.push("Le résumé français est vide : il apparaît sur la page d'accueil.");
    }
    attention = notes.join(" ");
  } catch (e) {
    console.error("Admin : échec de la modification d'un studio", e);
    return { erreur: "L'opération a échoué. Réessayez dans un instant." };
  }

  // Le site public est mis en cache : on le rafraîchit tout de suite (accueil, menu, pages studios, réservation)
  revalidatePath("/[locale]", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/reglages");

  return {
    ok: "Studio enregistré : le site est à jour.",
    attention: attention || undefined,
  };
}