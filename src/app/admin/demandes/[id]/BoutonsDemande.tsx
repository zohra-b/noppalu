"use client";

import { useActionState } from "react";
import {
  LIBELLES_PAIEMENT,
  MOYENS_PAIEMENT,
} from "@/lib/reservations-types";
import { traiterDemande, type EtatAction } from "../actions";

const BASE =
  "w-full rounded-md px-5 py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const PRIMAIRE = `${BASE} bg-green text-linen hover:bg-[#244D2B]`;
const SECONDAIRE = `${BASE} border border-green text-green hover:bg-green hover:text-linen`;
const DANGER = `${BASE} border border-red-700 text-red-700 hover:bg-red-700 hover:text-white`;

type Props = {
  id: string;
  statut: string;
  datesLibres: boolean;
  email: string | null;
  envoiAuto: boolean; // un e-mail de confirmation partira-t-il tout seul ?
};

export default function BoutonsDemande({
  id,
  statut,
  datesLibres,
  email,
  envoiAuto,
}: Props) {
  const [etat, action, enCours] = useActionState<EtatAction, FormData>(
    traiterDemande,
    null,
  );

  // Demande de confirmation avant les actions difficiles à défaire
  const confirmer =
    (question: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!window.confirm(question)) e.preventDefault();
    };

  const acceptee = statut === "acceptee" || statut === "en_attente_paiement";

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />

      {statut === "nouvelle" && (
        <>
          <button
            type="submit"
            name="action"
            value="accepter"
            disabled={enCours || !datesLibres}
            className={PRIMAIRE}
          >
            Accepter et bloquer les dates
          </button>
          <button
            type="submit"
            name="action"
            value="refuser"
            disabled={enCours}
            onClick={confirmer("Refuser cette demande ?")}
            className={DANGER}
          >
            Refuser
          </button>
        </>
      )}

      {acceptee && (
        <>
          <p className="text-sm leading-6 text-gray-600">
            Les dates sont bloquées. Quand le paiement est arrivé, enregistrez-le
            ci-dessous
            {envoiAuto
              ? " : un e-mail de confirmation sera envoyé au client."
              : " (aucun e-mail automatique pour cette réservation)."}
          </p>

          <div>
            <label htmlFor="moyen" className="mb-1 block text-sm font-medium">
              Moyen de paiement (facultatif)
            </label>
            <select
              id="moyen"
              name="moyen"
              defaultValue=""
              className="w-full rounded-md border border-[#C6B06B] bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-green"
            >
              <option value="">Non précisé</option>
              {MOYENS_PAIEMENT.map((m) => (
                <option key={m} value={m}>
                  {LIBELLES_PAIEMENT[m]}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            name="action"
            value="payee"
            disabled={enCours}
            onClick={confirmer(
              envoiAuto
                ? `Marquer cette réservation comme payée ? Un e-mail de confirmation sera envoyé à ${email}.`
                : "Marquer cette réservation comme payée ? Aucun e-mail automatique ne sera envoyé.",
            )}
            className={PRIMAIRE}
          >
            Paiement reçu
          </button>
          <button
            type="submit"
            name="action"
            value="annuler"
            disabled={enCours}
            onClick={confirmer(
              "Annuler cette réservation et libérer les dates sur le calendrier ?",
            )}
            className={DANGER}
          >
            Annuler et libérer les dates
          </button>
        </>
      )}

      {statut === "payee" && (
        <>
          {envoiAuto && (
            <button
              type="submit"
              name="action"
              value="renvoyer"
              disabled={enCours}
              onClick={confirmer(
                `Renvoyer l'e-mail de confirmation à ${email} ?`,
              )}
              className={SECONDAIRE}
            >
              Renvoyer la confirmation
            </button>
          )}
          <button
            type="submit"
            name="action"
            value="annuler"
            disabled={enCours}
            onClick={confirmer(
              "Annuler cette réservation payée et libérer les dates ? Pensez à régler un éventuel remboursement avec le client, selon la politique d'annulation.",
            )}
            className={DANGER}
          >
            Annuler la réservation et libérer les dates
          </button>
        </>
      )}

      {(statut === "refusee" || statut === "expiree") && (
        <p className="text-sm text-gray-600">Cette demande est clôturée.</p>
      )}

      {etat?.erreur && (
        <p role="alert" className="text-sm text-red-700">
          {etat.erreur}
        </p>
      )}
      {etat?.attention && (
        <p role="alert" className="text-sm font-medium text-[#8B3017]">
          {etat.attention}
        </p>
      )}
      {etat?.ok && (
        <p role="status" className="text-sm text-green">
          {etat.ok}
        </p>
      )}
    </form>
  );
}