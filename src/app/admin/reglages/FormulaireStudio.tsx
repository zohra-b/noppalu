"use client";

import { useActionState, useState } from "react";
import type { EquipementCode } from "@/lib/data";
import {
  EQUIPEMENTS,
  LIMITES_STUDIO,
  NOMS_LANGUES,
} from "@/lib/studios-types";
import { modifierStudio, type EtatStudio } from "./actions-studios";

type Studio = {
  slug: string;
  nom: string;
  publie: boolean;
  capacite: number;
  litCm: number;
  equipements: EquipementCode[];
  resume: Record<string, string>;
  description: Record<string, string>;
};

type Props = { studio: Studio; langues: string[] };

const CHAMP =
  "w-full rounded-md border border-[#C6B06B] bg-white px-2.5 py-1.5 text-base outline-none focus:ring-2 focus:ring-green md:text-sm";
const ETIQUETTE = "mb-0.5 block text-xs font-medium";

export default function FormulaireStudio({ studio, langues }: Props) {
  const [nom, setNom] = useState(studio.nom);
  const [publie, setPublie] = useState(studio.publie);
  const [capacite, setCapacite] = useState(String(studio.capacite));
  const [lit, setLit] = useState(String(studio.litCm));
  const [equipements, setEquipements] = useState<EquipementCode[]>(
    studio.equipements,
  );
  const [resume, setResume] = useState<Record<string, string>>(() =>
    Object.fromEntries(langues.map((l) => [l, studio.resume[l] ?? ""])),
  );
  const [description, setDescription] = useState<Record<string, string>>(() =>
    Object.fromEntries(langues.map((l) => [l, studio.description[l] ?? ""])),
  );

  const [etat, action, enCours] = useActionState<EtatStudio, FormData>(
    modifierStudio,
    null,
  );

  const plusieursLangues = langues.length > 1;
  const nomLangue = (l: string) => NOMS_LANGUES[l] ?? l;
  const id = (champ: string) => `${studio.slug}-${champ}`;

  function basculer(code: EquipementCode, coche: boolean) {
    setEquipements((actuels) =>
      coche
        ? actuels.includes(code)
          ? actuels
          : [...actuels, code]
        : actuels.filter((c) => c !== code),
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="slug" value={studio.slug} />

      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <label htmlFor={id("nom")} className={ETIQUETTE}>
            Nom
          </label>
          <input
            id={id("nom")}
            name="nom"
            type="text"
            required
            maxLength={LIMITES_STUDIO.nomMax}
            autoComplete="off"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className={CHAMP}
          />
        </div>

        <label className="flex items-center gap-2 text-sm md:mt-5">
          <input
            type="checkbox"
            name="publie"
            checked={publie}
            onChange={(e) => setPublie(e.target.checked)}
            className="h-4 w-4 accent-[#2F6036]"
          />
          Visible sur le site
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label htmlFor={id("capacite")} className={ETIQUETTE}>
            Capacité (personnes)
          </label>
          <input
            id={id("capacite")}
            name="capacite"
            type="number"
            required
            inputMode="numeric"
            min={LIMITES_STUDIO.capaciteMin}
            max={LIMITES_STUDIO.capaciteMax}
            value={capacite}
            onChange={(e) => setCapacite(e.target.value)}
            className={CHAMP}
          />
        </div>
        <div>
          <label htmlFor={id("lit")} className={ETIQUETTE}>
            Lit (largeur en cm)
          </label>
          <input
            id={id("lit")}
            name="lit"
            type="number"
            required
            inputMode="numeric"
            min={LIMITES_STUDIO.litMin}
            max={LIMITES_STUDIO.litMax}
            value={lit}
            onChange={(e) => setLit(e.target.value)}
            className={CHAMP}
          />
        </div>
      </div>

      <fieldset>
        <legend className={ETIQUETTE}>Équipements</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {EQUIPEMENTS.map((e) => (
            <label key={e.code} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="equipements"
                value={e.code}
                checked={equipements.includes(e.code)}
                onChange={(ev) => basculer(e.code, ev.target.checked)}
                className="h-4 w-4 accent-[#2F6036]"
              />
              {e.libelle}
            </label>
          ))}
        </div>
      </fieldset>

      {langues.map((l) => (
        <div key={l} className="space-y-3">
          <div>
            <label htmlFor={id(`resume-${l}`)} className={ETIQUETTE}>
              {plusieursLangues
                ? `Résumé (${nomLangue(l)})`
                : "Résumé (cartes de la page d'accueil)"}
            </label>
            <textarea
              id={id(`resume-${l}`)}
              name={`resume_${l}`}
              rows={2}
              maxLength={LIMITES_STUDIO.resumeMax}
              value={resume[l] ?? ""}
              onChange={(e) =>
                setResume((r) => ({ ...r, [l]: e.target.value }))
              }
              className={`${CHAMP} resize-y`}
            />
            <p className="mt-0.5 text-right text-xs text-gray-500">
              {(resume[l] ?? "").length} / {LIMITES_STUDIO.resumeMax}
            </p>
          </div>

          <div>
            <label htmlFor={id(`description-${l}`)} className={ETIQUETTE}>
              {plusieursLangues
                ? `Description (${nomLangue(l)})`
                : "Description (page du studio)"}
            </label>
            <textarea
              id={id(`description-${l}`)}
              name={`description_${l}`}
              rows={6}
              maxLength={LIMITES_STUDIO.descriptionMax}
              value={description[l] ?? ""}
              onChange={(e) =>
                setDescription((d) => ({ ...d, [l]: e.target.value }))
              }
              className={`${CHAMP} resize-y`}
            />
            <p className="mt-0.5 text-right text-xs text-gray-500">
              {(description[l] ?? "").length} / {LIMITES_STUDIO.descriptionMax}
            </p>
          </div>
        </div>
      ))}

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
        onClick={(e) => {
          if (
            studio.publie &&
            !publie &&
            !window.confirm(
                            "Masquer ce studio ? Sa page ne sera plus accessible et il ne pourra plus être réservé ; sa carte restera sur la page Studios avec « Bientôt disponible ». Les réservations existantes sont conservées.",
            )
          ) {
            e.preventDefault();
          }
        }}
        className="w-full rounded-md bg-green px-4 py-2 text-sm font-medium text-linen transition-colors hover:bg-[#244D2B] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
      >
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}