"use server";
// POUR MODIFIER LES DATES DES RESA
import { revalidatePath } from "next/cache";
import { getChevauchements } from "@/lib/blocages";
import {
  LIBELLES_SOURCE,
  MESSAGES_BLOCAGE,
  validerBlocage,
} from "@/lib/blocages-types";
import { formaterDate, getDemande } from "@/lib/demandes";
import { formaterFcfa } from "@/lib/monnaie";
import { aujourdhuiSenegal } from "@/lib/sejour";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/session";

export type EtatDates = {
  erreur?: string;
  ok?: string;
  attention?: string;
} | null;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function messageErreur(
  error: { code?: string; message?: string },
  idDemande: string,
  studio: string,
  debut: string,
  fin: string,
): Promise<string> {
  if (error.code === "23P01") {
    // On ignore le blocage de cette réservation elle-même pour ne lister que les vrais conflits
    const { data: bloc } = await createAdminClient()
      .from("availability_blocks")
      .select("id")
      .eq("request_id", idDemande)
      .maybeSingle();
    const conflits = await getChevauchements(
      studio,
      debut,
      fin,
      bloc?.id,
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
  if (error.message?.includes("statut_invalide")) {
    return "Cette réservation ne peut plus être modifiée. Rechargez la page.";
  }
  if (error.message?.includes("demande_introuvable")) {
    return "Demande introuvable.";
  }
  if (error.message?.includes("blocage_introuvable")) {
    return "Le blocage de dates de cette réservation est introuvable : contactez-moi avant de la modifier.";
  }
  console.error("Admin : erreur inattendue à la modification des dates", error);
  return "L'opération a échoué. Réessayez dans un instant.";
}

export async function modifierDatesReservation(
  _etat: EtatDates,
  formData: FormData,
): Promise<EtatDates> {
  await requireAdmin(); // toujours en premier : une action est une adresse publique

  const id = String(formData.get("id") ?? "");
  const debut = String(formData.get("arrivee") ?? "").trim();
  const fin = String(formData.get("depart") ?? "").trim();
  const montantBrut = String(formData.get("montant") ?? "").replace(
    /[\s\u00a0\u202f]/g,
    "",
  );

  if (!UUID.test(id)) return { erreur: "Requête invalide." };

  const code = validerBlocage(debut, fin, aujourdhuiSenegal());
  if (code) return { erreur: MESSAGES_BLOCAGE[code] };

  // Montant vide = on garde le montant actuel
  let montant: number | null = null;
  if (montantBrut) {
    if (!/^\d{1,9}$/.test(montantBrut)) {
      return { erreur: "Montant invalide : indiquez un nombre entier en FCFA." };
    }
    montant = Number(montantBrut);
  }

  try {
    const demande = await getDemande(id);
    if (!demande) return { erreur: "Demande introuvable." };
    if (
      !["acceptee", "en_attente_paiement", "payee"].includes(demande.statut)
    ) {
      return {
        erreur: "Cette réservation ne peut plus être modifiée. Rechargez la page.",
      };
    }

    const datesChangent = debut !== demande.arrivee || fin !== demande.depart;
    const montantChange = montant !== null && montant !== demande.estimation;
    if (!datesChangent && !montantChange) return { erreur: "Rien n'a changé." };

    const { error } = await createAdminClient().rpc(
      "modifier_dates_reservation",
      { p_id: id, p_debut: debut, p_fin: fin, p_montant: montant },
    );
    if (error) {
      return {
        erreur: await messageErreur(error, id, demande.studioSlug, debut, fin),
      };
    }

    // Les calendriers publics sont mis en cache : on les rafraîchit tout de suite
    revalidatePath("/[locale]/bungalows", "page");
    revalidatePath("/[locale]/bungalows/[slug]", "page");
    revalidatePath("/[locale]/reservation", "page");
    revalidatePath("/admin/reservations");
    revalidatePath(`/admin/demandes/${id}`);

    const attention =
      montantChange && montant !== null
        ? `Le montant est passé de ${demande.estimation !== null ? formaterFcfa(demande.estimation) : "non renseigné"} à ${formaterFcfa(montant)} : précisez-le au client${demande.statut === "payee" ? " (différence à payer ou à rembourser)" : ""}.`
        : undefined;

    return {
      ok: datesChangent
        ? "Dates modifiées : le calendrier du site est à jour. Prévenez le client."
        : "Montant modifié.",
      attention,
    };
  } catch (e) {
    console.error("Admin : échec de la modification des dates", e);
    return { erreur: "L'opération a échoué. Réessayez dans un instant." };
  }
}