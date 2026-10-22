"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/session";

export type EtatAction = { erreur?: string; ok?: string } | null;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTIONS = ["accepter", "refuser", "payee", "annuler"];

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

  try {
    if (action === "accepter") {
      const { error } = await admin.rpc("accepter_demande", { p_id: id });
      if (error) return { erreur: messageErreur(error) };
      ok = "Demande acceptée : les dates sont bloquées sur le calendrier.";
    } else if (action === "annuler") {
      const { error } = await admin.rpc("annuler_demande", { p_id: id });
      if (error) return { erreur: messageErreur(error) };
      ok = "Demande annulée : les dates sont libérées.";
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
      ok = "Demande refusée.";
    } else {
      const { data, error } = await admin
        .from("booking_requests")
        .update({ status: "payee" })
        .eq("id", id)
        .in("status", ["acceptee", "en_attente_paiement"])
        .select("id");
      if (error) return { erreur: messageErreur(error) };
      if (!data || data.length === 0) {
        return { erreur: "Cette demande ne peut pas être marquée comme payée." };
      }
      ok = "Paiement enregistré.";
    }
  } catch (e) {
    console.error("Admin : échec du traitement d'une demande", e);
    return { erreur: "L'opération a échoué. Réessayez dans un instant." };
  }

  rafraichirSitePublic();
  revalidatePath("/admin/demandes");
  revalidatePath(`/admin/demandes/${id}`);
  return { ok };
}