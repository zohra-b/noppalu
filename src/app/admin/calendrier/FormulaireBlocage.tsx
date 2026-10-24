"use client";

import { useActionState, useState } from "react";
import {
  LIBELLES_SOURCE,
  MESSAGES_BLOCAGE,
  SOURCES_MODIFIABLES,
  validerBlocage,
  type Blocage,
} from "@/lib/blocages-types";
import { ajouterJours, dateValide, etatDate, nombreNuits } from "@/lib/sejour";
import {
  creerBlocage,
  modifierBlocage,
  supprimerBlocage,
  type EtatBlocage,
} from "./actions";

type Studio = { slug: string; nom: string };

type Props = {
  studios: Studio[];
  aujourdhui: string; // AAAA-MM-JJ
  blocage?: Blocage; // présent = modification
  initial?: { studio?: string; arrivee?: string };
  onSucces: (texte: string) => void;
  onAnnuler: () => void;
};

const CHAMP =
  "w-full rounded-md border border-[#C6B06B] bg-white px-2.5 py-1.5 text-base outline-none focus:ring-2 focus:ring-green aria-[invalid=true]:border-red-700 md:text-sm";
const ETIQUETTE = "mb-0.5 block text-xs font-medium";

export default function FormulaireBlocage({
  studios,
  aujourdhui,
  blocage,
  initial,
  onSucces,
  onAnnuler,
}: Props) {
  const modification = blocage !== undefined;
  const p = blocage?.id ?? "nouveau"; // préfixe des identifiants de champs
  const arriveeInitiale = blocage?.debut ?? initial?.arrivee ?? "";

  const [studio, setStudio] = useState(
    blocage?.studioSlug ?? initial?.studio ?? "",
  );
  const [arrivee, setArrivee] = useState(arriveeInitiale);
  const [depart, setDepart] = useState(
    blocage?.fin ??
      (dateValide(arriveeInitiale) ? ajouterJours(arriveeInitiale, 1) : ""),
  );
  const [source, setSource] = useState<string>(blocage?.source ?? "manuel");
  const [nom, setNom] = useState(blocage?.nom ?? "");
  const [email, setEmail] = useState(blocage?.email ?? "");
  const [telephone, setTelephone] = useState(blocage?.telephone ?? "");
  const [note, setNote] = useState(blocage?.note ?? "");
  const [champActif, setChampActif] = useState<"arrivee" | "depart" | null>(
    null,
  );

  const [etat, action, enCours] = useActionState<EtatBlocage, FormData>(
    async (precedent, donnees) => {
      const resultat = await (modification ? modifierBlocage : creerBlocage)(
        precedent,
        donnees,
      );
      if (resultat?.ok) onSucces(resultat.ok);
      return resultat;
    },
    null,
  );

  const [etatSuppr, actionSuppr, enCoursSuppr] = useActionState<
    EtatBlocage,
    FormData
  >(async (precedent, donnees) => {
    const resultat = await supprimerBlocage(precedent, donnees);
    if (resultat?.ok) onSucces(resultat.ok);
    return resultat;
  }, null);

  // Une date est « en erreur » si elle est complète mais impossible (1111, 2150…),
  // ou si l'année est restée incomplète une fois le champ quitté.
  // Pendant la frappe de l'année, on ne dit rien (Chrome envoie 0002, 0020…).
  const dateEnErreur = (cle: "arrivee" | "depart", valeur: string) => {
    const e = etatDate(valeur);
    return e === "invalide" || (e === "en_cours" && champActif !== cle);
  };
  const arriveeEnErreur = dateEnErreur("arrivee", arrivee);
  const departEnErreur = dateEnErreur("depart", depart);

  const datesSaisies = dateValide(arrivee) && dateValide(depart);
  const codeErreur = datesSaisies
    ? validerBlocage(arrivee, depart, aujourdhui)
    : null;
  const nuits = datesSaisies && !codeErreur ? nombreNuits(arrivee, depart) : 0;

  const messageDates =
    arriveeEnErreur || departEnErreur
      ? MESSAGES_BLOCAGE.dates_invalides
      : codeErreur
        ? MESSAGES_BLOCAGE[codeErreur]
        : null;

  function changerArrivee(valeur: string) {
    setArrivee(valeur);
    // Propose un départ le lendemain si le départ est vide ou n'est plus après l'arrivée
    if (dateValide(valeur) && (!dateValide(depart) || depart <= valeur)) {
      setDepart(ajouterJours(valeur, 1));
    }
  }

  const occupe = enCours || enCoursSuppr;
  const peutEnregistrer = studio !== "" && datesSaisies && !codeErreur;

  return (
    <form
      action={action}
      className="space-y-2 rounded-lg border border-[#C6B06B] bg-white p-3 md:p-4"
    >
      <h3 className="text-sm font-semibold text-green">
        {modification ? "Modifier le blocage" : "Nouveau blocage"}
      </h3>

      {blocage && <input type="hidden" name="id" value={blocage.id} />}

      {/* Ligne 1 : studio, dates, type */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <label htmlFor={`studio-${p}`} className={ETIQUETTE}>
            Studio
          </label>
          <select
            id={`studio-${p}`}
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
            htmlFor={`arrivee-${p}`}
            className={ETIQUETTE}
            title="Première nuit bloquée"
          >
            Arrivée
          </label>
          <input
            id={`arrivee-${p}`}
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
            htmlFor={`depart-${p}`}
            className={ETIQUETTE}
            title="Jour où le studio est libéré (la nuit précédente est la dernière bloquée)"
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
            id={`depart-${p}`}
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
          <label htmlFor={`source-${p}`} className={ETIQUETTE}>
            Type
          </label>
          <select
            id={`source-${p}`}
            name="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className={CHAMP}
          >
            {SOURCES_MODIFIABLES.map((s) => (
              <option key={s} value={s}>
                {LIBELLES_SOURCE[s]}
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
      <div className="grid gap-2 md:grid-cols-3">
        <div>
          <label htmlFor={`nom-${p}`} className={ETIQUETTE}>
            Nom du client
          </label>
          <input
            id={`nom-${p}`}
            name="nom"
            type="text"
            maxLength={100}
            autoComplete="off"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className={CHAMP}
          />
        </div>
        <div>
          <label htmlFor={`email-${p}`} className={ETIQUETTE}>
            E-mail
          </label>
          <input
            id={`email-${p}`}
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
          <label htmlFor={`telephone-${p}`} className={ETIQUETTE}>
            Téléphone
          </label>
          <input
            id={`telephone-${p}`}
            name="telephone"
            type="tel"
            maxLength={30}
            autoComplete="off"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className={CHAMP}
          />
        </div>
      </div>

      {/* Note : libellé réservé aux lecteurs d'écran, l'aide est dans le champ */}
      <div>
        <label htmlFor={`note-${p}`} className="sr-only">
          Note
        </label>
        <textarea
          id={`note-${p}`}
          name="note"
          rows={2}
          maxLength={500}
          placeholder="Note (facultatif) : séjour personnel, travaux, détails…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={`${CHAMP} resize-y`}
        />
      </div>

      {etat?.erreur && (
        <p role="alert" className="text-sm text-red-700">
          {etat.erreur}
        </p>
      )}
      {etatSuppr?.erreur && (
        <p role="alert" className="text-sm text-red-700">
          {etatSuppr.erreur}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          disabled={occupe || !peutEnregistrer}
          className="min-w-32 flex-1 rounded-md bg-green px-4 py-2 text-sm font-medium text-linen transition-colors hover:bg-[#244D2B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enCours
            ? "Enregistrement…"
            : modification
              ? "Enregistrer"
              : "Ajouter le blocage"}
        </button>
        <button
          type="button"
          onClick={onAnnuler}
          disabled={occupe}
          className="rounded-md border border-green px-4 py-2 text-sm font-medium text-green transition-colors hover:bg-green hover:text-linen disabled:opacity-50"
        >
          Annuler
        </button>
        {modification && (
          <button
            type="submit"
            formAction={actionSuppr}
            formNoValidate
            disabled={occupe}
            onClick={(e) => {
              if (
                !window.confirm(
                  "Libérer ces dates ? Le studio redeviendra disponible sur le site.",
                )
              ) {
                e.preventDefault();
              }
            }}
            className="rounded-md border border-red-700 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-700 hover:text-white disabled:opacity-50"
          >
            {enCoursSuppr ? "Libération…" : "Libérer ces dates"}
          </button>
        )}
      </div>
    </form>
  );
}