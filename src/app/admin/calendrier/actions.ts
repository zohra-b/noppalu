"use server";

import { revalidatePath } from "next/cache";
import { getChevauchements } from "@/lib/blocages";
import {
  LIBELLES_SOURCE,
  MESSAGES_BLOCAGE,
  SOURCES_MODIFIABLES,
  validerBlocage,
  type SourceBlocage,
} from "@/lib/blocages-types";
import { getBungalow } from "@/lib/data";
import { formaterDate } from "@/lib/demandes";
import { aujourdhuiSenegal } from "@/lib/sejour";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/session";
import { validerEmail } from "@/lib/validation";

export type EtatBlocage = { erreur?: string; ok?: string } | null;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Saisie = {
  studio: string;
  debut: string;
  fin: string;
  source: SourceBlocage;
  nom: string | null;
  email: string | null;
  telephone: string | null;
  note: string | null;
};

// Lit et vérifie le formulaire : renvoie la saisie, ou un message d'erreur (texte)
async function lireSaisie(formData: FormData): Promise<Saisie | string> {
  const studio = String(formData.get("studio") ?? "").trim();
  const debut = String(formData.get("arrivee") ?? "").trim();
  const fin = String(formData.get("depart") ?? "").trim();
  const source = String(formData.get("source") ?? "");
  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!SOURCES_MODIFIABLES.includes(source as SourceBlocage)) {
    return "Type de blocage invalide.";
  }
  const code = validerBlocage(debut, fin, aujourdhuiSenegal());
  if (code) return MESSAGES_BLOCAGE[code];
  if (nom.length > 100) return "Le nom est trop long (100 caractères maximum).";
  if (email && validerEmail(email)) return "Adresse e-mail invalide.";
  if (telephone.length > 30) {
    return "Le numéro de téléphone est trop long (30 caractères maximum).";
  }
  if (note.length > 500) return "La note est trop longue (500 caractères maximum).";

  const existe = await getBungalow(studio).catch(() => null);
  if (!existe) return "Studio inconnu.";

  return {
    studio,
    debut,
    fin,
    source: source as SourceBlocage,
    nom: nom || null,
    email: email || null,
    telephone: telephone || null,
    note: note || null,
  };
}

async function messageErreur(
  error: { code?: string; message?: string },
  saisie: Saisie,
  ignorerId?: string,
): Promise<string> {
  if (error.code === "23P01") {
    const conflits = await getChevauchements(
      saisie.studio,
      saisie.debut,
      saisie.fin,
      ignorerId,
    ).catch(() => []);
    if (conflits.length > 0) {
      const liste = conflits
        .map(
          (c) =>
            `du ${formaterDate(c.debut)} au ${formaterDate(c.fin)} (${LIBELLES_SOURCE[c.source] ?? c.source}${c.nom ? `, ${c.nom}` : ""})`,
        )
        .join(" ; ");
      return `Ces dates chevauchent un autre blocage de ce studio : ${liste}.`;
    }
    return "Ces dates chevauchent un autre blocage de ce studio.";
  }
  if (error.code === "23503") return "Studio inconnu.";
  console.error("Admin : erreur inattendue sur un blocage", error);
  return "L'opération a échoué. Réessayez dans un instant.";
}

// Les calendriers publics sont mis en cache : on les rafraîchit tout de suite
function rafraichir() {
  revalidatePath("/[locale]/bungalows", "page");
  revalidatePath("/[locale]/bungalows/[slug]", "page");
  revalidatePath("/[locale]/reservation", "page");
  revalidatePath("/admin/reservations");
}

export async function creerBlocage(
  _etat: EtatBlocage,
  formData: FormData,
): Promise<EtatBlocage> {
  await requireAdmin(); // toujours en premier : une action est une adresse publique

  const saisie = await lireSaisie(formData);
  if (typeof saisie === "string") return { erreur: saisie };

  try {
    const { error } = await createAdminClient()
      .from("availability_blocks")
      .insert({
        bungalow_slug: saisie.studio,
        start_date: saisie.debut,
        end_date: saisie.fin,
        source: saisie.source,
        guest_name: saisie.nom,
        guest_email: saisie.email,
        guest_phone: saisie.telephone,
        note: saisie.note,
      });
    if (error) return { erreur: await messageErreur(error, saisie) };
  } catch (e) {
    console.error("Admin : échec de la création d'un blocage", e);
    return { erreur: "L'opération a échoué. Réessayez dans un instant." };
  }

  rafraichir();
  return { ok: "Blocage ajouté : ces dates sont indisponibles sur le site." };
}

export async function modifierBlocage(
  _etat: EtatBlocage,
  formData: FormData,
): Promise<EtatBlocage> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return { erreur: "Requête invalide." };

  const saisie = await lireSaisie(formData);
  if (typeof saisie === "string") return { erreur: saisie };

  try {
    const { data, error } = await createAdminClient()
      .from("availability_blocks")
      .update({
        bungalow_slug: saisie.studio,
        start_date: saisie.debut,
        end_date: saisie.fin,
        source: saisie.source,
        guest_name: saisie.nom,
        guest_email: saisie.email,
        guest_phone: saisie.telephone,
        note: saisie.note,
      })
      .eq("id", id)
      .is("request_id", null) // un blocage venu d'une demande se gère depuis la demande
      .neq("source", "demande_site")
      .select("id");
    if (error) return { erreur: await messageErreur(error, saisie, id) };
    if (!data || data.length === 0) {
      return {
        erreur:
          "Ce blocage n'existe plus, ou il vient d'une demande du site : modifiez-le depuis la demande.",
      };
    }
  } catch (e) {
    console.error("Admin : échec de la modification d'un blocage", e);
    return { erreur: "L'opération a échoué. Réessayez dans un instant." };
  }

  rafraichir();
  return { ok: "Blocage modifié." };
}

export async function supprimerBlocage(
  _etat: EtatBlocage,
  formData: FormData,
): Promise<EtatBlocage> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return { erreur: "Requête invalide." };

  try {
    const { data, error } = await createAdminClient()
      .from("availability_blocks")
      .delete()
      .eq("id", id)
      .is("request_id", null)
      .neq("source", "demande_site")
      .select("id");
    if (error) {
      console.error("Admin : erreur lors de la libération d'un blocage", error);
      return { erreur: "L'opération a échoué. Réessayez dans un instant." };
    }
    if (!data || data.length === 0) {
      return {
        erreur:
          "Ce blocage n'existe plus, ou il vient d'une demande du site : annulez-le depuis la demande.",
      };
    }
  } catch (e) {
    console.error("Admin : échec de la libération d'un blocage", e);
    return { erreur: "L'opération a échoué. Réessayez dans un instant." };
  }

  rafraichir();
  return { ok: "Dates libérées : le studio est de nouveau disponible sur le site." };
}