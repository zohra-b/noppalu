"use client";

import { useActionState, useState } from "react";
import { grasEquilibre } from "@/lib/avec-gras";
import { LIMITES_REGLAGES } from "@/lib/reglages-types";
import {
  PERIODES,
  formaterJourMois,
  type SaisonCle,
  type Tarifs,
} from "@/lib/saisons";
import { NOMS_LANGUES } from "@/lib/studios-types";
import { enregistrerTarifs, type EtatReglage } from "./actions-reglages";

type Props = {
  tarifs: Tarifs;
  afficherPrix: boolean;
  annonce: Record<string, string>;
  langues: string[];
};

const SAISONS: { cle: SaisonCle; libelle: string }[] = [
  { cle: "basse", libelle: "Basse saison" },
  { cle: "haute", libelle: "Haute saison" },
  { cle: "fetes", libelle: "Fêtes de fin d'année" },
];

const CHAMP =
  "w-full rounded-md border border-[#C6B06B] bg-white px-2.5 py-1.5 text-base outline-none focus:ring-2 focus:ring-green md:text-sm";
const ETIQUETTE = "mb-0.5 block text-xs font-medium";

const periode = (cle: SaisonCle) =>
  `du ${formaterJourMois(PERIODES[cle].debut, "fr")} au ${formaterJourMois(PERIODES[cle].fin, "fr")}`;

export default function FormulaireTarifs({
  tarifs,
  afficherPrix,
  annonce,
  langues,
}: Props) {
  const [prix, setPrix] = useState<Record<SaisonCle, string>>({
    basse: String(tarifs.basse),
    haute: String(tarifs.haute),
    fetes: String(tarifs.fetes),
  });
  const [afficher, setAfficher] = useState(afficherPrix);
  const [annonces, setAnnonces] = useState<Record<string, string>>(() =>
    Object.fromEntries(langues.map((l) => [l, annonce[l] ?? ""])),
  );

  const [etat, action, enCours] = useActionState<EtatReglage, FormData>(
    enregistrerTarifs,
    null,
  );

  const plusieursLangues = langues.length > 1;

  return (
    <form action={action} className="space-y-3">
      {langues.map((l) => (
        <div key={l}>
          <label htmlFor={`annonce-${l}`} className={ETIQUETTE}>
            {plusieursLangues
              ? `Annonce au-dessus des tarifs (${NOMS_LANGUES[l] ?? l})`
              : "Annonce au-dessus des tarifs (facultatif)"}
          </label>
          <textarea
            id={`annonce-${l}`}
            name={`annonce_${l}`}
            rows={3}
            maxLength={LIMITES_REGLAGES.annonceMax}
            placeholder="Ex. : **Offre exceptionnelle :** du 3 au 9 novembre, le petit-déjeuner est offert."
            value={annonces[l] ?? ""}
            onChange={(e) =>
              setAnnonces((a) => ({ ...a, [l]: e.target.value }))
            }
            className={`${CHAMP} resize-y`}
          />
          <p className="mt-0.5 flex flex-wrap justify-between gap-x-3 text-xs text-gray-500">
            <span>
              {grasEquilibre(annonces[l] ?? "") ? (
                "Laissez vide pour ne rien afficher. Le texte reste affiché tant que vous ne l'effacez pas."
              ) : (
                <span className="text-red-700">« ** » mal fermé</span>
              )}
            </span>
            <span>
              {(annonces[l] ?? "").length} / {LIMITES_REGLAGES.annonceMax}
            </span>
          </p>
        </div>
      ))}

      <div className="grid gap-3 md:grid-cols-3">
        {SAISONS.map((s) => (
          <div key={s.cle}>
            <label htmlFor={`prix-${s.cle}`} className={ETIQUETTE}>
              {s.libelle} (FCFA par nuit)
            </label>
            <input
              id={`prix-${s.cle}`}
              name={`prix_${s.cle}`}
              type="text"
              required
              inputMode="numeric"
              pattern="[0-9 ]+"
              title="Nombre entier en FCFA"
              autoComplete="off"
              value={prix[s.cle]}
              onChange={(e) =>
                setPrix((p) => ({ ...p, [s.cle]: e.target.value }))
              }
              className={CHAMP}
            />
            <p className="mt-0.5 text-xs text-gray-500">{periode(s.cle)}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-600">
        Les dates des saisons sont dans le code : elles ne se modifient pas ici.
        Les nouveaux prix s&apos;appliquent aux nouvelles demandes ; les
        réservations déjà enregistrées gardent leur montant.
      </p>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="afficher_prix"
          checked={afficher}
          onChange={(e) => setAfficher(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#2F6036]"
        />
        <span>
          Afficher les tarifs sur le site
          <span className="block text-xs text-gray-600">
            Décoché, le site affiche « Nous consulter pour connaître nos
            tarifs ». Ces prix servent quand même aux estimations des demandes.
          </span>
        </span>
      </label>

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

      <button
        type="submit"
        disabled={enCours}
        className="w-full rounded-md bg-green px-4 py-2 text-sm font-medium text-linen transition-colors hover:bg-[#244D2B] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
      >
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}