"use server";

import { revalidatePath } from "next/cache";
import { getChevauchements } from "@/lib/blocages";
import {
  LIBELLES_SOURCE,
  MESSAGES_BLOCAGE,
  validerBlocage,
} from "@/lib/blocages-types";
import { getBungalow } from "@/lib/data";
import { formaterDate } from "@/lib/demandes";
import { ORIGINES_CREATION } from "@/lib/reservations-types";
import { aujourdhuiSenegal } from "@/lib/sejour";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/session";
import { validerEmail } from "@/lib/validation";

export type EtatCreation = { erreur?: string; ok?: string; id?: string } | null;

async function messageErreur(
  error: { code?: string; message?: string },
  studio: string,
  debut: string,
  fin: string,
): Promise<string> {
  if (error.code === "23P01") {
    const conflits = await getChevauchements(studio, debut, fin).catch(() => []);
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
  if (error.message?.includes("origine_invalide")) return "Origine invalide.";
  if (error.code === "23503") return "Studio inconnu.";
  console.error("Admin : erreur inattendue à la création d'une réservation", error);
  return "L'opération a échoué. Réessayez dans un instant.";
}

export async function creerReservation(
  _etat: EtatCreation,
  formData: FormData,
): Promise<EtatCreation> {
  await requireAdmin(); // toujours en premier : une action est une adresse publique

  const studio = String(formData.get("studio") ?? "").trim();
  const debut = String(formData.get("arrivee") ?? "").trim();
  const fin = String(formData.get("depart") ?? "").trim();
  const origine = String(formData.get("origine") ?? "");
  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const voyageursBrut = String(formData.get("voyageurs") ?? "").trim();
  const montantBrut = String(formData.get("montant") ?? "").replace(
    /[\s\u00a0\u202f]/g,
    "",
  );
  const payee = String(formData.get("paiement") ?? "") === "regle";

  if (!(ORIGINES_CREATION as string[]).includes(origine)) {
    return { erreur: "Origine invalide." };
  }

  const code = validerBlocage(debut, fin, aujourdhuiSenegal());
  if (code) return { erreur: MESSAGES_BLOCAGE[code] };

  if (nom.length > 100) return { erreur: "Le nom est trop long (100 caractères maximum)." };
  if (email && validerEmail(email)) return { erreur: "Adresse e-mail invalide." };
  if (telephone.length > 30) {
    return { erreur: "Le numéro de téléphone est trop long (30 caractères maximum)." };
  }
  if (note.length > 1000) {
    return { erreur: "La note est trop longue (1 000 caractères maximum)." };
  }

  let voyageurs: number | null = null;
  if (voyageursBrut) {
    const n = Number(voyageursBrut);
    if (!Number.isInteger(n) || n < 1 || n > 20) {
      return { erreur: "Nombre de voyageurs invalide (de 1 à 20)." };
    }
    voyageurs = n;
  }

  let montant: number | null = null;
  if (montantBrut) {
    if (!/^\d{1,9}$/.test(montantBrut)) {
      return { erreur: "Montant invalide : indiquez un nombre entier en FCFA." };
    }
    montant = Number(montantBrut);
  }

  const existe = await getBungalow(studio).catch(() => null);
  if (!existe) return { erreur: "Studio inconnu." };

  let id: string;
  try {
    // La réservation et son blocage de dates sont créés ensemble, ou pas du tout
    const { data, error } = await createAdminClient().rpc("creer_reservation", {
      p_slug: studio,
      p_debut: debut,
      p_fin: fin,
      p_origine: origine,
      p_payee: payee,
      p_nom: nom || null,
      p_email: email || null,
      p_telephone: telephone || null,
      p_voyageurs: voyageurs,
      p_montant: montant,
      p_message: note || null,
      p_langue: "fr",
    });
    if (error) return { erreur: await messageErreur(error, studio, debut, fin) };
    id = String(data);
  } catch (e) {
    console.error("Admin : échec de la création d'une réservation", e);
    return { erreur: "L'opération a échoué. Réessayez dans un instant." };
  }

  // Les calendriers publics sont mis en cache : on les rafraîchit tout de suite
  revalidatePath("/[locale]/bungalows", "page");
  revalidatePath("/[locale]/bungalows/[slug]", "page");
  revalidatePath("/[locale]/reservation", "page");
  revalidatePath("/admin/reservations");

  return {
    ok: "Réservation créée : les dates sont bloquées sur le site.",
    id,
  };
}