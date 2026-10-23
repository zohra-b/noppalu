"use server";

import { revalidatePath } from "next/cache";
import { getBungalow } from "@/lib/data";
import { getDemande } from "@/lib/demandes";
import { envoyerConfirmationPaiement } from "@/lib/emails-demande";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/session";

export type EtatAction = {
  erreur?: string;
  ok?: string;
  attention?: string;
} | null;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTIONS = ["accepter", "refuser", "payee", "annuler", "renvoyer"];

type ErreurBase = { code?: string; message?: string };

function messageErreur(error: ErreurBase): string {
  if (error.code === "23P01") {
    return "Ces dates ne sont plus disponibles : un autre blocage les chevauche.";
  }
  if (error.message?.includes("statut_invalide")) {
    return "Cette demande a déjà été traitée. Rechargez la page.";
  }
  if (error.message?.includes("demande_introuvable")) {
    return "Demande introuvable.";
  }
  console.error("Admin : erreur inattendue", error);
  return "L'opération a échoué. Réessayez dans un instant.";
}

// Les calendriers publics sont mis en cache : on les rafraîchit tout de suite
function rafraichirSitePublic() {
  revalidatePath("/[locale]/bungalows", "page");
  revalidatePath("/[locale]/bungalows/[slug]", "page");
  revalidatePath("/[locale]/reservation", "page");
}

// Envoie la confirmation au client et note l'envoi
async function envoyerEtNoter(id: string): Promise<boolean> {
  const demande = await getDemande(id);
  if (!demande) return false;

  const studio =
    (await getBungalow(demande.studioSlug))?.nom ?? demande.studioSlug;
  const envoye = await envoyerConfirmationPaiement(demande, studio);

  if (envoye) {
    const { error } = await createAdminClient()
      .from("booking_requests")
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq("id", id);
    if (error) console.error("Admin : envoi non noté", error);
  }
  return envoye;
}

export async function traiterDemande(
  _etat: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  await requireAdmin(); // toujours en premier : une action est une adresse publique

  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!UUID.test(id) || !ACTIONS.includes(action)) {
    return { erreur: "Requête invalide." };
  }

  const admin = createAdminClient();
  let ok = "";
  let attention: string | undefined;

  try {
    if (action === "accepter") {
      const { error } = await admin.rpc("accepter_demande", { p_id: id });
      if (error) return { erreur: messageErreur(error) };
      ok =
        "Demande acceptée : les dates sont bloquées. Envoyez maintenant le message d'acceptation au client (délai de paiement : 72 h).";
    } else if (action === "annuler") {
      const { error } = await admin.rpc("annuler_demande", { p_id: id });
      if (error) return { erreur: messageErreur(error) };
            ok = "Demande annulée : les dates sont libérées. Pensez à prévenir le client avec le message préparé sur cette page.";
    } else if (action === "refuser") {
      const { data, error } = await admin
        .from("booking_requests")
        .update({ status: "refusee" })
        .eq("id", id)
        .eq("status", "nouvelle")
        .select("id");
      if (error) return { erreur: messageErreur(error) };
      if (!data || data.length === 0) {
        return { erreur: "Cette demande a déjà été traitée. Rechargez la page." };
      }
      ok = "Demande refusée. Pensez à prévenir le client avec le message préparé sur cette page.";;
    } else if (action === "payee") {
      const { data, error } = await admin
        .from("booking_requests")
        .update({ status: "payee", paid_at: new Date().toISOString() })
        .eq("id", id)
        .in("status", ["acceptee", "en_attente_paiement"])
        .select("id");
      if (error) return { erreur: messageErreur(error) };
      if (!data || data.length === 0) {
        return { erreur: "Cette demande ne peut pas être marquée comme payée." };
      }
      if (await envoyerEtNoter(id)) {
        ok = "Paiement enregistré. L'e-mail de confirmation a été envoyé au client.";
      } else {
        attention =
          "Paiement enregistré, mais l'e-mail de confirmation n'a pas pu être envoyé. Utilisez « Renvoyer la confirmation ».";
      }
    } else {
      // renvoyer
      const demande = await getDemande(id);
      if (!demande || demande.statut !== "payee") {
        return {
          erreur: "Seule une demande payée peut recevoir la confirmation.",
        };
      }
      if (!(await envoyerEtNoter(id))) {
        return { erreur: "L'envoi a échoué. Réessayez dans un instant." };
      }
      ok = "Confirmation envoyée au client.";
    }
  } catch (e) {
    console.error("Admin : échec du traitement d'une demande", e);
    return { erreur: "L'opération a échoué. Réessayez dans un instant." };
  }

  rafraichirSitePublic();
  revalidatePath("/admin/demandes");
  revalidatePath(`/admin/demandes/${id}`);
  return { ok, attention };
}