"use client";

import { useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Periode } from "@/lib/data";

const MOIS_MAX = 18; // on peut consulter jusqu'à 18 mois à l'avance

const CLASSES = {
  libre: "bg-[#2F6036]/10 text-[#2F6036]",
  occupee: "bg-[#8B3017]/15 text-[#8B3017]/70 line-through",
  passee: "text-gray-300",
} as const;

const pad = (n: number) => String(n).padStart(2, "0");
// `mois` va de 0 (janvier) à 11 (décembre)
const cleJour = (annee: number, mois: number, jour: number) =>
  `${annee}-${pad(mois + 1)}-${pad(jour)}`;

// Date du jour côté navigateur. Pendant le premier affichage (serveur et
// hydratation), on utilise la date calculée par le serveur pour éviter tout
// décalage, puis on bascule sur celle du visiteur.
const sansAbonnement = () => () => {};
function aujourdhuiNavigateur(): string {
  const d = new Date();
  return cleJour(d.getFullYear(), d.getMonth(), d.getDate());
}

type Props = {
  periodes: Periode[];
  aujourdhui: string; // AAAA-MM-JJ, calculé par le serveur
};

export default function Calendrier({
  periodes,
  aujourdhui: aujourdhuiServeur,
}: Props) {
  const t = useTranslations("Calendrier");
  const locale = useLocale();

  const local = useSyncExternalStore<string | null>(
    sansAbonnement,
    aujourdhuiNavigateur,
    () => null,
  );
  const aujourdhui = local ?? aujourdhuiServeur;

  const [decalage, setDecalage] = useState(0); // 0 = mois en cours

  const [anneeJ, moisJ] = aujourdhui.split("-").map(Number);
  const indexMois = anneeJ * 12 + (moisJ - 1) + decalage;
  const annee = Math.floor(indexMois / 12);
  const mois = indexMois % 12;

  const titreBrut = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(annee, mois, 1)));
  const titreMois = titreBrut.charAt(0).toLocaleUpperCase(locale) + titreBrut.slice(1);

  const formatSemaine = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  });
  const formatLong = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  });

  // Semaine commençant le lundi (le 1er janvier 2024 était un lundi)
  const entetes = Array.from({ length: 7 }, (_, i) =>
    formatSemaine.format(new Date(Date.UTC(2024, 0, 1 + i))),
  );
  const casesVides = (new Date(Date.UTC(annee, mois, 1)).getUTCDay() + 6) % 7;
  const nbJours = new Date(Date.UTC(annee, mois + 1, 0)).getUTCDate();

  function statut(jour: string): "passee" | "occupee" | "libre" {
    if (jour < aujourdhui) return "passee";
    if (periodes.some((p) => p.debut <= jour && jour < p.fin)) return "occupee";
    return "libre";
  }

  return (
    <section className="mb-10 rounded-lg bg-[#FFFEF6] p-6 shadow-sm md:p-8">
      <h2 className="mb-2 font-serif text-2xl text-[#2F6036]">{t("titre")}</h2>
      <p className="mb-6 max-w-3xl text-sm leading-6 text-gray-600">
        {t("intro")}
      </p>

      <div className="max-w-md">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setDecalage((d) => d - 1)}
            disabled={decalage === 0}
            aria-label={t("precedent")}
            className="rounded-md px-3 py-1 text-xl text-[#2F6036] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
          >
            ‹
          </button>
          <p aria-live="polite" className="font-medium text-[#2F6036]">
            {titreMois}
          </p>
          <button
            type="button"
            onClick={() => setDecalage((d) => d + 1)}
            disabled={decalage >= MOIS_MAX}
            aria-label={t("suivant")}
            className="rounded-md px-3 py-1 text-xl text-[#2F6036] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
          >
            ›
          </button>
        </div>

        <div
          className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500"
          aria-hidden="true"
        >
          {entetes.map((e, i) => (
            <div key={i} className="py-1 uppercase">
              {e}
            </div>
          ))}
        </div>

        <ul className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: casesVides }, (_, i) => (
            <li key={`vide-${i}`} aria-hidden="true" />
          ))}
          {Array.from({ length: nbJours }, (_, i) => {
            const jour = i + 1;
            const cle = cleJour(annee, mois, jour);
            const s = statut(cle);
            return (
              <li
                key={cle}
                aria-label={`${formatLong.format(new Date(Date.UTC(annee, mois, jour)))}, ${t(s)}`}
                className={`flex aspect-square items-center justify-center rounded-md text-sm ${CLASSES[s]} ${
                  cle === aujourdhui ? "ring-2 ring-[#2F6036]" : ""
                }`}
              >
                {jour}
              </li>
            );
          })}
        </ul>

        <ul className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
          <li className="flex items-center gap-2">
            <span
              className={`h-4 w-4 rounded ${CLASSES.libre}`}
              aria-hidden="true"
            />
            {t("libre")}
          </li>
          <li className="flex items-center gap-2">
            <span
              className="h-4 w-4 rounded bg-[#8B3017]/15"
              aria-hidden="true"
            />
            {t("occupee")}
          </li>
        </ul>
      </div>
    </section>
  );
}