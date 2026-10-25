"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { MESSAGES_BLOCAGE, validerBlocage } from "@/lib/blocages-types";
import { formaterMontantDouble } from "@/lib/monnaie";
import {
  LIBELLES_ORIGINE,
  ORIGINES_CREATION,
  type OrigineDemande,
} from "@/lib/reservations-types";
import { prixDuSejour, type Tarifs } from "@/lib/saisons";
import { ajouterJours, dateValide, etatDate, nombreNuits } from "@/lib/sejour";
import { creerReservation, type EtatCreation } from "./actions";

type Studio = { slug: string; nom: string };

type Props = {
  studios: Studio[];
  tarifs: Tarifs | null;
  aujourdhui: string; // AAAA-MM-JJ
};

const CHAMP =
  "w-full rounded-md border border-[#C6B06B] bg-white px-2.5 py-1.5 text-base outline-none focus:ring-2 focus:ring-green aria-[invalid=true]:border-red-700 md:text-sm";
const ETIQUETTE = "mb-0.5 block text-xs font-medium";

export default function NouvelleReservation({
  studios,
  tarifs,
  aujourdhui,
}: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [cle, setCle] = useState(0);
  const [succes, setSucces] = useState<{ texte: string; id: string } | null>(
    null,
  );

  return (
    <div className="mb-5">
      {succes && (
        <p
          role="status"
          className="mb-3 rounded-md bg-[#2F6036]/10 p-3 text-sm text-green"
        >
          {succes.texte}{" "}
          <Link
            href={`/admin/demandes/${succes.id}`}
            className="font-medium underline underline-offset-4"
          >
            Ouvrir la fiche
          </Link>
        </p>
      )}

      {ouvert ? (
        <FormulaireReservation
          key={cle}
          studios={studios}
          tarifs={tarifs}
          aujourdhui={aujourdhui}
          onSucces={(texte, id) => {
            setOuvert(false);
            setSucces({ texte, id });
          }}
          onAnnuler={() => setOuvert(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setSucces(null);
            setCle((c) => c + 1);
            setOuvert(true);
          }}
          className="rounded-md bg-green px-4 py-2 text-sm font-medium text-linen transition-colors hover:bg-[#244D2B]"
        >
          + Nouvelle réservation
        </button>
      )}
    </div>
  );
}

function FormulaireReservation({
  studios,
  tarifs,
  aujourdhui,
  onSucces,
  onAnnuler,
}: Props & {
  onSucces: (texte: string, id: string) => void;
  onAnnuler: () => void;
}) {
  const [studio, setStudio] = useState("");
  const [arrivee, setArrivee] = useState("");
  const [depart, setDepart] = useState("");
  const [origine, setOrigine] = useState<OrigineDemande>("direct");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [voyageurs, setVoyageurs] = useState("");
  const [montant, setMontant] = useState<string | null>(null); // null = pas encore modifié
  const [reglee, setReglee] = useState<boolean | null>(null); // null = valeur par défaut
  const [note, setNote] = useState("");
  const [champActif, setChampActif] = useState<"arrivee" | "depart" | null>(
    null,
  );

  const [etat, action, enCours] = useActionState<EtatCreation, FormData>(
    async (precedent, donnees) => {
      const resultat = await creerReservation(precedent, donnees);
      if (resultat?.ok && resultat.id) onSucces(resultat.ok, resultat.id);
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

  // Tarif du site pour ces dates : prérempli pour une réservation directe, proposé sinon
  const suggere = tarifs && datesOk ? prixDuSejour(arrivee, depart, tarifs) : null;
  const montantAffiche =
    montant ?? (origine === "direct" && suggere !== null ? String(suggere) : "");

  // Airbnb encaisse pour nous : « déjà réglé » par défaut, « à encaisser » pour les autres
  const estReglee = reglee ?? origine === "airbnb";

  function changerArrivee(valeur: string) {
    setArrivee(valeur);
    // Propose un départ le lendemain si le départ est vide ou n'est plus après l'arrivée
    if (dateValide(valeur) && (!dateValide(depart) || depart <= valeur)) {
      setDepart(ajouterJours(valeur, 1));
    }
  }

  const peutCreer = studio !== "" && datesOk;

  return (
    <form
      action={action}
      className="space-y-2 rounded-lg border border-[#C6B06B] bg-white p-3 md:p-4"
    >
      <h3 className="text-sm font-semibold text-green">Nouvelle réservation</h3>

      {/* Ligne 1 : studio, dates, origine */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="r-studio" className={ETIQUETTE}>
            Studio
          </label>
          <select
            id="r-studio"
            name="studio"
            required
            value={studio}
            onChange={(e) => setStudio(e.target.value)}
            className={CHAMP}
          >
            <option value="">Choisir…</option>
            {studios.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="r-arrivee"
            className={ETIQUETTE}
            title="Première nuit"
          >
            Arrivée
          </label>
          <input
            id="r-arrivee"
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
          <label
            htmlFor="r-depart"
            className={ETIQUETTE}
            title="Jour du départ (la nuit précédente est la dernière)"
          >
            Départ
            {nuits > 0 && (
              <span className="font-normal text-gray-500">
                {" "}
                · {nuits} nuit{nuits > 1 ? "s" : ""}
              </span>
            )}
          </label>
          <input
            id="r-depart"
            name="depart"
            type="date"
            required
            value={depart}
            min={dateValide(arrivee) ? ajouterJours(arrivee, 1) : undefined}
            onChange={(e) => setDepart(e.target.value)}
            onFocus={() => setChampActif("depart")}
            onBlur={() => setChampActif(null)}
            aria-invalid={departEnErreur}
            className={CHAMP}
          />
        </div>

        <div className="col-span-2 md:col-span-1">
          <label htmlFor="r-origine" className={ETIQUETTE}>
            Origine
          </label>
          <select
            id="r-origine"
            name="origine"
            value={origine}
            onChange={(e) => setOrigine(e.target.value as OrigineDemande)}
            className={CHAMP}
          >
            {ORIGINES_CREATION.map((o) => (
              <option key={o} value={o}>
                {LIBELLES_ORIGINE[o]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {messageDates && (
        <p role="alert" className="text-xs text-red-700">
          {messageDates}
        </p>
      )}

      {/* Ligne 2 : client */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="r-nom" className={ETIQUETTE}>
            Nom du client
          </label>
          <input
            id="r-nom"
            name="nom"
            type="text"
            maxLength={100}
            autoComplete="off"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className={CHAMP}
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="r-email" className={ETIQUETTE}>
            E-mail
          </label>
          <input
            id="r-email"
            name="email"
            type="email"
            maxLength={200}
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={CHAMP}
          />
        </div>
        <div>
          <label htmlFor="r-telephone" className={ETIQUETTE}>
            Téléphone
          </label>
          <input
            id="r-telephone"
            name="telephone"
            type="tel"
            maxLength={30}
            autoComplete="off"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className={CHAMP}
          />
        </div>
        <div>
          <label htmlFor="r-voyageurs" className={ETIQUETTE}>
            Voyageurs
          </label>
          <input
            id="r-voyageurs"
            name="voyageurs"
            type="number"
            min={1}
            max={20}
            inputMode="numeric"
            value={voyageurs}
            onChange={(e) => setVoyageurs(e.target.value)}
            className={CHAMP}
          />
        </div>
      </div>

      {/* Ligne 3 : montant, paiement, note */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div>
          <label htmlFor="r-montant" className={ETIQUETTE}>
            Montant (FCFA)
          </label>
          <input
            id="r-montant"
            name="montant"
            type="text"
            inputMode="numeric"
            pattern="[0-9 ]*"
            title="Nombre entier en FCFA"
            autoComplete="off"
            placeholder={suggere !== null ? String(suggere) : ""}
            value={montantAffiche}
            onChange={(e) => setMontant(e.target.value)}
            className={CHAMP}
          />
        </div>
        <div>
          <label htmlFor="r-paiement" className={ETIQUETTE}>
            Paiement
          </label>
          <select
            id="r-paiement"
            name="paiement"
            value={estReglee ? "regle" : "encaisser"}
            onChange={(e) => setReglee(e.target.value === "regle")}
            className={CHAMP}
          >
            <option value="encaisser">À encaisser</option>
            <option value="regle">Déjà réglé</option>
          </select>
        </div>
        <div className="col-span-2">
          <label htmlFor="r-note" className="sr-only">
            Note
          </label>
          <textarea
            id="r-note"
            name="note"
            rows={1}
            maxLength={1000}
            placeholder="Note (facultatif) : heure d'arrivée, demande particulière…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${CHAMP} resize-y md:mt-4`}
          />
        </div>
      </div>

      {suggere !== null && montantAffiche !== String(suggere) && (
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
          disabled={enCours || !peutCreer}
          className="min-w-32 flex-1 rounded-md bg-green px-4 py-2 text-sm font-medium text-linen transition-colors hover:bg-[#244D2B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enCours ? "Création…" : "Créer la réservation"}
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