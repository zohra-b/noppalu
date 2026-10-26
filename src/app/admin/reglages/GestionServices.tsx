"use client";

import { useState } from "react";
import type { Service } from "@/lib/data";
import { UNITES } from "@/lib/reglages-types";
import FormulaireService from "./FormulaireService";

type Props = {
  services: Service[];
  langues: string[];
  ordreSuivant: number;
};

const formatNombre = new Intl.NumberFormat("fr");

function nomAffiche(s: Service, langues: string[]): string {
  for (const l of langues) if (s.nom[l]) return s.nom[l];
  return Object.values(s.nom)[0] ?? "Sans nom";
}

function prixAffiche(s: Service): string {
  if (s.prix === null) return "Nous consulter";
  const unite = UNITES.find((u) => u.code === s.unite)?.libelle;
  return `${formatNombre.format(s.prix)} FCFA${unite ? ` ${unite}` : ""}`;
}

export default function GestionServices({
  services,
  langues,
  ordreSuivant,
}: Props) {
  const [ajout, setAjout] = useState(false);
  const [cle, setCle] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {message && (
        <p
          role="status"
          className="rounded-md bg-[#2F6036]/10 p-3 text-sm text-green"
        >
          {message}
        </p>
      )}

      {services.length === 0 && (
        <p className="text-sm text-gray-600">Aucun service pour le moment.</p>
      )}

      {services.map((s) => (
        <details key={s.id} className="rounded-lg bg-[#FFFEF6] shadow-sm">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 p-4">
            <span>
              <span className="font-semibold text-green">
                {nomAffiche(s, langues)}
              </span>
              <span className="block text-sm text-gray-600">
                {prixAffiche(s)}
              </span>
            </span>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                s.actif
                  ? "bg-[#2F6036]/15 text-[#2F6036]"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {s.actif ? "Affiché" : "Masqué"}
            </span>
          </summary>
          <div className="border-t border-[#C6B06B]/40 p-4">
            <FormulaireService
              service={s}
              langues={langues}
              ordreParDefaut={ordreSuivant}
            />
          </div>
        </details>
      ))}

      {ajout ? (
        <div className="rounded-lg border border-[#C6B06B] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-green">
            Nouveau service
          </h3>
          <FormulaireService
            key={cle}
            langues={langues}
            ordreParDefaut={ordreSuivant}
            onSucces={(texte) => {
              setAjout(false);
              setMessage(texte);
            }}
            onAnnuler={() => setAjout(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setCle((c) => c + 1);
            setAjout(true);
          }}
          className="rounded-md bg-green px-4 py-2 text-sm font-medium text-linen transition-colors hover:bg-[#244D2B]"
        >
          + Ajouter un service
        </button>
      )}
    </div>
  );
}