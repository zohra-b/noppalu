import "server-only";
import { Resend } from "resend";
import type { Demande } from "@/lib/demandes";
import { messageConfirmation } from "@/lib/messages-demande";
import { confirmationAutomatique } from "@/lib/reservations-types";
import { nombreNuits } from "@/lib/sejour";

/**
 * Envoie la confirmation de réservation au client. Renvoie true si l'envoi a réussi.
 * Ne part jamais pour Booking ni Airbnb, ni sans adresse e-mail.
 */
export async function envoyerConfirmationPaiement(
  demande: Demande,
  studio: string,
): Promise<boolean> {
  const destinataire = demande.email;
  if (!destinataire || !confirmationAutomatique(demande.origine, destinataire)) {
    return false;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const reponse = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !from || !reponse) {
    console.error("Admin : variables d'e-mail manquantes");
    return false;
  }

  try {
    const m = messageConfirmation(
      {
        nom: demande.nom,
        studio,
        arrivee: demande.arrivee,
        depart: demande.depart,
        nuits: nombreNuits(demande.arrivee, demande.depart),
        voyageurs: demande.voyageurs,
        montantFcfa: null,
        paiement: null,
        origine: demande.origine,
      },
      demande.langue,
    );

    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: destinataire,
      replyTo: reponse,
      subject: m.sujet,
      text: m.texte,
      html: m.html,
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Admin : échec de l'envoi de la confirmation", e);
    return false;
  }
}