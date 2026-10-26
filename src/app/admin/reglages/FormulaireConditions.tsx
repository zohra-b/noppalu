"use client";

import { useActionState, useState } from "react";
import { avecGras, grasEquilibre } from "@/lib/avec-gras";
import { LIMITES_REGLAGES } from "@/lib/reglages-types";
import { NOMS_LANGUES } from "@/lib/studios-types";
import { enregistrerConditions, type EtatReglage } from "./actions-reglages";

type Props = {
  conditions: Record<string, string[]>;
  langues: string[];
};

const CHAMP =
  "w-full rounded-md border border-[#C6B06B] bg-white px-2.5 py-1.5 text-base outline-none focus:ring-2 focus:ring-green md:text-sm";
const ETIQUETTE = "mb-0.5 block text-xs font-medium";

export default function FormulaireConditions({ conditions, langues }: Props) {
  const [textes, setTextes] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      langues.map((l) => [l, (conditions[l] ?? []).join("\n")]),
    ),
  );

  const [etat, action, enCours] = useActionState<EtatReglage, FormData>(
    enregistrerConditions,
    null,
  );

  const plusieursLangues = langues.length > 1;

  return (
    <form action={action} className="space-y-4">
      <p className="text-xs text-gray-600">
        Une condition par ligne. Entourez de <code>**</code> le texte à mettre
        en gras, par exemple <code>**Capacité :** 2 personnes par studio</code>.
        La ligne de capacité est un texte libre : mettez-la à jour si la
        capacité d&apos;un studio change. La politique d&apos;annulation des
        e-mails envoyés aux clients est dans le code, pas ici.
      </p>

      {langues.map((l) => {
        const lignes = (textes[l] ?? "")
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean);
        return (
          <div key={l}>
            <label htmlFor={`conditions-${l}`} className={ETIQUETTE}>
              {plusieursLangues
                ? `Conditions (${NOMS_LANGUES[l] ?? l})`
                : "Conditions et informations pratiques"}
            </label>
            <textarea
              id={`conditions-${l}`}
              name={`conditions_${l}`}
              rows={9}
              value={textes[l] ?? ""}
              onChange={(e) =>
                setTextes((t) => ({ ...t, [l]: e.target.value }))
              }
              className={`${CHAMP} resize-y`}
            />
            <p className="mt-0.5 text-right text-xs text-gray-500">
              {lignes.length} / {LIMITES_REGLAGES.conditionsMax} conditions
            </p>

            {lignes.length > 0 && (
              <div className="mt-2 rounded-md bg-white p-3 text-sm">
                <p className="mb-1 text-xs font-medium text-gray-500">Aperçu</p>
                <ul className="list-disc space-y-1 pl-5">
                  {lignes.map((ligne, i) => (
                    <li key={i}>
                      {grasEquilibre(ligne) ? (
                        avecGras(ligne)
                      ) : (
                        <span className="text-red-700">
                          {ligne} (« ** » mal fermé)
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}

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