"use client";

import { useActionState, useRef, useState } from "react";
import { MESSAGES_BLOCAGE, validerBlocage } from "@/lib/blocages-types";
import { formaterMontantDouble } from "@/lib/monnaie";
import { prixDuSejour, type Tarifs } from "@/lib/saisons";
import { ajouterJours, dateValide, etatDate, nombreNuits } from "@/lib/sejour";
import { modifierDatesReservation, type EtatDates } from "../actions-dates";

type Props = {
  id: string;
  arrivee: string; // AAAA-MM-JJ
  depart: string; // AAAA-MM-JJ
  montant: number | null;
  tarifs: Tarifs | null;
  aujourdhui: string; // AAAA-MM-JJ
};

const CHAMP =
  "w-full rounded-md border border-[#C6B06B] bg-white px-2.5 py-1.5 text-base outline-none focus:ring-2 focus:ring-green aria-[invalid=true]:border-red-700 md:text-sm";
const ETIQUETTE = "mb-0.5 block text-xs font-medium";

export default function ModifierDates(props: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [cle, setCle] = useState(0);
  const [resultat, setResultat] = useState<{
    ok: string;
    attention?: string;
  } | null>(null);

  return (
    <section className="rounded-lg bg-[#FFFEF6] p-4 shadow-sm">
      {resultat && (
        <div className="mb-3 space-y-1 text-sm">
          <p role="status" className="text-green">
            {resultat.ok}
          </p>
          {resultat.attention && (
            <p role="alert" className="font-medium text-[#8B3017]">
              {resultat.attention}
            </p>
          )}
        </div>
      )}

      {ouvert ? (
        <FormulaireDates
          key={cle}
          {...props}
          onSucces={(ok, attention) => {
            setOuvert(false);
            setResultat({ ok, attention });
          }}
          onAnnuler={() => setOuvert(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setResultat(null);
            setCle((c) => c + 1);
            setOuvert(true);
          }}
          className="rounded-md border border-green px-4 py-2 text-sm font-medium text-green transition-colors hover:bg-green hover:text-linen"
        >
          Modifier les dates
        </button>
      )}
    </section>
  );
}

function FormulaireDates({
  id,
  arrivee: arriveeInitiale,
  depart: departInitial,
  montant: montantInitial,
  tarifs,
  aujourdhui,
  onSucces,
  onAnnuler,
}: Props & {
  onSucces: (ok: string, attention?: string) => void;
  onAnnuler: () => void;
}) {
  const montantDepart = montantInitial !== null ? String(montantInitial) : "";

  const [arrivee, setArrivee] = useState(arriveeInitiale);
  const [depart, setDepart] = useState(departInitial);
  const [montant, setMontant] = useState(montantDepart);
  const [champActif, setChampActif] = useState<"arrivee" | "depart" | null>(
    null,
  );
  // Durée du séjour : changer l'arrivée décale le départ en gardant cette durée
  const duree = useRef(nombreNuits(arriveeInitiale, departInitial) || 1);

  const [etat, action, enCours] = useActionState<EtatDates, FormData>(
    async (precedent, donnees) => {
      const resultat = await modifierDatesReservation(precedent, donnees);
      if (resultat?.ok) onSucces(resultat.ok, resultat.attention);
      return resultat;
    },
    null,
  );

  // Une date est « en erreur » si elle est complète mais impossible (1111, 2150…),
  // ou si l'année est restée incomplète une fois le champ quitté.
  // Pendant la frappe de l'année, on ne dit rien (Chrome envoie 0002, 0020…).
  const dateEnErreur = (champ: "arrivee" | "depart", valeur: string) => {
    const e = etatDate(valeur);
    return e === "invalide" || (e === "en_cours" && champActif !== champ);
  };
  const arriveeEnErreur = dateEnErreur("arrivee", arrivee);
  const departEnErreur = dateEnErreur("depart", depart);

  const datesSaisies = dateValide(arrivee) && dateValide(depart);
  const codeErreur = datesSaisies
    ? validerBlocage(arrivee, depart, aujourdhui)
    : null;
  const datesOk = datesSaisies && !codeErreur;
  const nuits = datesOk ? nombreNuits(arrivee, depart) : 0;

  const messageDates =
    arriveeEnErreur || departEnErreur
      ? MESSAGES_BLOCAGE.dates_invalides
      : codeErreur
        ? MESSAGES_BLOCAGE[codeErreur]
        : null;

  const suggere = tarifs && datesOk ? prixDuSejour(arrivee, depart, tarifs) : null;

  const inchange =
    arrivee === arriveeInitiale &&
    depart === departInitial &&
    montant === montantDepart;

  function changerArrivee(valeur: string) {
    setArrivee(valeur);
    if (dateValide(valeur)) setDepart(ajouterJours(valeur, duree.current));
  }

  function changerDepart(valeur: string) {
    setDepart(valeur);
    if (dateValide(arrivee) && dateValide(valeur) && valeur > arrivee) {
      duree.current = nombreNuits(arrivee, valeur);
    }
  }

  return (
    <form
      action={action}
      className="space-y-2 rounded-lg border border-[#C6B06B] bg-white p-3 md:p-4"
    >
      <h3 className="text-sm font-semibold text-green">Modifier les dates</h3>
      <input type="hidden" name="id" value={id} />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <div>
          <label htmlFor="md-arrivee" className={ETIQUETTE}>
            Arrivée
          </label>
          <input
            id="md-arrivee"
            name="arrivee"
            type="date"
            required
            value={arrivee}
            onChange={(e) => changerArrivee(e.target.value)}
            onFocus={() => setChampActif("arrivee")}
            onBlur={() => setChampActif(null)}
            aria-invalid={arriveeEnErreur}
            className={CHAMP}
          />
        </div>
        <div>
          <label htmlFor="md-depart" className={ETIQUETTE}>
            Départ
            {nuits > 0 && (
              <span className="font-normal text-gray-500">
                {" "}
                · {nuits} nuit{nuits > 1 ? "s" : ""}
              </span>
            )}
          </label>
          <input
            id="md-depart"
            name="depart"
            type="date"
            required
            value={depart}
            min={dateValide(arrivee) ? ajouterJours(arrivee, 1) : undefined}
            onChange={(e) => changerDepart(e.target.value)}
            onFocus={() => setChampActif("depart")}
            onBlur={() => setChampActif(null)}
            aria-invalid={departEnErreur}
            className={CHAMP}
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="md-montant" className={ETIQUETTE}>
            Montant (FCFA)
          </label>
          <input
            id="md-montant"
            name="montant"
            type="text"
            inputMode="numeric"
            pattern="[0-9 ]*"
            title="Nombre entier en FCFA"
            autoComplete="off"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            className={CHAMP}
          />
        </div>
      </div>

      {messageDates && (
        <p role="alert" className="text-xs text-red-700">
          {messageDates}
        </p>
      )}

      {suggere !== null && String(suggere) !== montant && (
        <p className="text-xs text-gray-600">
          Tarif du site pour ces dates : {formaterMontantDouble(suggere)}{" "}
          <button
            type="button"
            onClick={() => setMontant(String(suggere))}
            className="font-medium text-green underline underline-offset-2"
          >
            Utiliser
          </button>
        </p>
      )}

      {etat?.erreur && (
        <p role="alert" className="text-sm text-red-700">
          {etat.erreur}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          disabled={enCours || !datesOk || inchange}
          className="min-w-32 flex-1 rounded-md bg-green px-4 py-2 text-sm font-medium text-linen transition-colors hover:bg-[#244D2B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={onAnnuler}
          disabled={enCours}
          className="rounded-md border border-green px-4 py-2 text-sm font-medium text-green transition-colors hover:bg-green hover:text-linen disabled:opacity-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}