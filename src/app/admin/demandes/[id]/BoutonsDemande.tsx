"use client";

import { useActionState } from "react";
import { traiterDemande, type EtatAction } from "../actions";

const BASE =
  "w-full rounded-md px-5 py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const PRIMAIRE = `${BASE} bg-green text-linen hover:bg-[#244D2B]`;
const DANGER = `${BASE} border border-red-700 text-red-700 hover:bg-red-700 hover:text-white`;

type Props = {
  id: string;
  statut: string;
  datesLibres: boolean;
};

export default function BoutonsDemande({ id, statut, datesLibres }: Props) {
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
            Les dates sont bloquées sur le calendrier. Quand le paiement est
            arrivé, enregistrez-le ci-dessous.
          </p>
          <button
            type="submit"
            name="action"
            value="payee"
            disabled={enCours}
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
              "Annuler cette demande et libérer les dates sur le calendrier ?",
            )}
            className={DANGER}
          >
            Annuler et libérer les dates
          </button>
        </>
      )}

      {statut === "payee" && (
        <button
          type="submit"
          name="action"
          value="annuler"
          disabled={enCours}
          onClick={confirmer(
            "Annuler cette réservation payée et libérer les dates ? Pensez à régler un éventuel remboursement avec le client.",
          )}
          className={DANGER}
        >
          Annuler la réservation et libérer les dates
        </button>
      )}

      {(statut === "refusee" || statut === "expiree") && (
        <p className="text-sm text-gray-600">Cette demande est clôturée.</p>
      )}

      {etat?.erreur && (
        <p role="alert" className="text-sm text-red-700">
          {etat.erreur}
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