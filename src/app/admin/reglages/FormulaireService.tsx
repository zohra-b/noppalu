"use client";

import { useActionState, useState } from "react";
import type { Service } from "@/lib/data";
import { LIMITES_REGLAGES, UNITES } from "@/lib/reglages-types";
import { NOMS_LANGUES } from "@/lib/studios-types";
import {
  enregistrerService,
  supprimerService,
  type EtatReglage,
} from "./actions-reglages";

type Props = {
  service?: Service; // absent = création
  langues: string[];
  ordreParDefaut: number;
  onSucces?: (texte: string) => void;
  onAnnuler?: () => void;
};

const CHAMP =
  "w-full rounded-md border border-[#C6B06B] bg-white px-2.5 py-1.5 text-base outline-none focus:ring-2 focus:ring-green md:text-sm";
const ETIQUETTE = "mb-0.5 block text-xs font-medium";

export default function FormulaireService({
  service,
  langues,
  ordreParDefaut,
  onSucces,
  onAnnuler,
}: Props) {
  const creation = service === undefined;
  const p = service?.id ?? "nouveau"; // préfixe des identifiants de champs

  const [noms, setNoms] = useState<Record<string, string>>(() =>
    Object.fromEntries(langues.map((l) => [l, service?.nom[l] ?? ""])),
  );
  const [prix, setPrix] = useState(
    service?.prix != null ? String(service.prix) : "",
  );
  const [unite, setUnite] = useState<string>(service?.unite ?? "");
  const [ordre, setOrdre] = useState(
    String(service?.ordre ?? ordreParDefaut),
  );
  const [actif, setActif] = useState(service?.actif ?? true);

  const [etat, action, enCours] = useActionState<EtatReglage, FormData>(
    async (precedent, donnees) => {
      const resultat = await enregistrerService(precedent, donnees);
      if (resultat?.ok && onSucces) onSucces(resultat.ok);
      return resultat;
    },
    null,
  );

  const [etatSuppr, actionSuppr, enCoursSuppr] = useActionState<
    EtatReglage,
    FormData
  >(supprimerService, null);

  const plusieursLangues = langues.length > 1;
  const occupe = enCours || enCoursSuppr;

  return (
    <form action={action} className="space-y-3">
      {service && <input type="hidden" name="id" value={service.id} />}

      <div className="grid gap-3 md:grid-cols-2">
        {langues.map((l) => (
          <div key={l}>
            <label htmlFor={`${p}-nom-${l}`} className={ETIQUETTE}>
              {plusieursLangues ? `Nom (${NOMS_LANGUES[l] ?? l})` : "Nom"}
            </label>
            <input
              id={`${p}-nom-${l}`}
              name={`nom_${l}`}
              type="text"
              maxLength={LIMITES_REGLAGES.serviceNomMax}
              autoComplete="off"
              value={noms[l] ?? ""}
              onChange={(e) => setNoms((n) => ({ ...n, [l]: e.target.value }))}
              className={CHAMP}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label htmlFor={`${p}-prix`} className={ETIQUETTE}>
            Prix (FCFA)
          </label>
          <input
            id={`${p}-prix`}
            name="prix"
            type="text"
            inputMode="numeric"
            pattern="[0-9 ]*"
            title="Nombre entier en FCFA, ou vide pour « nous consulter »"
            placeholder="Vide = nous consulter"
            autoComplete="off"
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            className={CHAMP}
          />
        </div>
        <div>
          <label htmlFor={`${p}-unite`} className={ETIQUETTE}>
            Unité
          </label>
          <select
            id={`${p}-unite`}
            name="unite"
            value={unite}
            onChange={(e) => setUnite(e.target.value)}
            className={CHAMP}
          >
            <option value="">Aucune</option>
            {UNITES.map((u) => (
              <option key={u.code} value={u.code}>
                {u.libelle}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${p}-ordre`} className={ETIQUETTE}>
            Ordre d&apos;affichage
          </label>
          <input
            id={`${p}-ordre`}
            name="ordre"
            type="number"
            inputMode="numeric"
            min={0}
            max={LIMITES_REGLAGES.ordreMax}
            value={ordre}
            onChange={(e) => setOrdre(e.target.value)}
            className={CHAMP}
          />
        </div>
        <label className="col-span-2 flex items-center gap-2 text-sm md:col-span-1 md:mt-5">
          <input
            type="checkbox"
            name="actif"
            checked={actif}
            onChange={(e) => setActif(e.target.checked)}
            className="h-4 w-4 accent-[#2F6036]"
          />
          Affiché sur le site
        </label>
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
      {etat?.ok && !creation && (
        <p role="status" className="text-sm text-green">
          {etat.ok}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={occupe}
          className="min-w-32 flex-1 rounded-md bg-green px-4 py-2 text-sm font-medium text-linen transition-colors hover:bg-[#244D2B] disabled:cursor-not-allowed disabled:opacity-50 md:flex-none"
        >
          {enCours
            ? "Enregistrement…"
            : creation
              ? "Ajouter le service"
              : "Enregistrer"}
        </button>
        {creation && onAnnuler && (
          <button
            type="button"
            onClick={onAnnuler}
            disabled={occupe}
            className="rounded-md border border-green px-4 py-2 text-sm font-medium text-green transition-colors hover:bg-green hover:text-linen disabled:opacity-50"
          >
            Annuler
          </button>
        )}
        {!creation && (
          <button
            type="submit"
            formAction={actionSuppr}
            formNoValidate
            disabled={occupe}
            onClick={(e) => {
              if (
                !window.confirm(
                  "Supprimer ce service ? Il disparaîtra du site. Pour le garder en réserve, décochez plutôt « Affiché sur le site ».",
                )
              ) {
                e.preventDefault();
              }
            }}
            className="rounded-md border border-red-700 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-700 hover:text-white disabled:opacity-50"
          >
            {enCoursSuppr ? "Suppression…" : "Supprimer"}
          </button>
        )}
      </div>
    </form>
  );
}