"use client";

import { useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Periode } from "@/lib/data";

type Studio = { slug: string; nom: string };
type Statut = "passee" | "occupee" | "partiel" | "libre";

const MOIS_MAX = 18; // on peut consulter jusqu'à 18 mois à l'avance

const CLASSES: Record<Statut, string> = {
  libre: "bg-[#2F6036]/10 text-[#2F6036]",
  partiel: "bg-[#C6B06B]/30 text-[#222222]",
  occupee: "bg-[#8B3017]/15 text-[#8B3017]/70 line-through",
  passee: "text-gray-300",
};

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
  studios: Studio[];
  periodesParStudio: Record<string, Periode[]>;
  aujourdhui: string; // AAAA-MM-JJ, calculé par le serveur
};

export default function Calendrier({
  studios,
  periodesParStudio,
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
  const [choix, setChoix] = useState<string>(
    studios.length > 1 ? "tous" : (studios[0]?.slug ?? "tous"),
  );
  const [jourChoisi, setJourChoisi] = useState<string | null>(null);

  if (studios.length === 0) return null;

  const plusieurs = studios.length > 1;
  const concernes =
    choix === "tous" ? studios : studios.filter((s) => s.slug === choix);

  function libresLe(jour: string): Studio[] {
    return concernes.filter(
      (s) =>
        !(periodesParStudio[s.slug] ?? []).some(
          (p) => p.debut <= jour && jour < p.fin,
        ),
    );
  }

  function statut(jour: string): Statut {
    if (jour < aujourdhui) return "passee";
    const n = libresLe(jour).length;
    if (n === 0) return "occupee";
    return n === concernes.length ? "libre" : "partiel";
  }

  function changerMois(delta: number) {
    setDecalage((d) => d + delta);
    setJourChoisi(null);
  }

  const [anneeJ, moisJ] = aujourdhui.split("-").map(Number);
  const indexMois = anneeJ * 12 + (moisJ - 1) + decalage;
  const annee = Math.floor(indexMois / 12);
  const mois = indexMois % 12;

  const titreBrut = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(annee, mois, 1)));
  const titreMois =
    titreBrut.charAt(0).toLocaleUpperCase(locale) + titreBrut.slice(1);

  const formatSemaine = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  });
  const formatLong = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  });
  const dateLongue = (cle: string) => {
    const [a, m, j] = cle.split("-").map(Number);
    return formatLong.format(new Date(Date.UTC(a, m - 1, j)));
  };

  // Semaine commençant le lundi (le 1er janvier 2024 était un lundi)
  const entetes = Array.from({ length: 7 }, (_, i) =>
    formatSemaine.format(new Date(Date.UTC(2024, 0, 1 + i))),
  );
  const casesVides = (new Date(Date.UTC(annee, mois, 1)).getUTCDay() + 6) % 7;
  const nbJours = new Date(Date.UTC(annee, mois + 1, 0)).getUTCDate();

  const options = [{ slug: "tous", nom: t("tous") }, ...studios];

  return (
    <section className="mb-10 rounded-lg bg-[#FFFEF6] p-6 shadow-sm md:p-8">
      <h2 className="mb-2 font-serif text-2xl text-[#2F6036]">{t("titre")}</h2>
      <p className="mb-6 max-w-3xl text-sm leading-6 text-gray-600">
        {plusieurs ? t("introGeneral") : t("intro")}
      </p>

      {plusieurs && (
        <div
          role="group"
          aria-label={t("choixStudio")}
          className="mb-5 flex flex-wrap gap-2"
        >
          {options.map((o) => (
            <button
              key={o.slug}
              type="button"
              aria-pressed={choix === o.slug}
              onClick={() => {
                setChoix(o.slug);
                setJourChoisi(null);
              }}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                choix === o.slug
                  ? "border-[#2F6036] bg-[#2F6036] text-white"
                  : "border-[#C6B06B] text-[#2F6036] hover:bg-white"
              }`}
            >
              {o.nom}
            </button>
          ))}
        </div>
      )}

      <div className="max-w-md">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => changerMois(-1)}
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
            onClick={() => changerMois(1)}
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
            const interactif = choix === "tous" && plusieurs && s !== "passee";
            const libelle = `${dateLongue(cle)}, ${t(s)}`;
            const anneau =
              cle === jourChoisi
                ? "ring-2 ring-[#222222]"
                : cle === aujourdhui
                  ? "ring-2 ring-[#2F6036]"
                  : "";
            const classes = `flex aspect-square w-full items-center justify-center rounded-md text-sm ${CLASSES[s]} ${anneau}`;

            return (
              <li key={cle} aria-label={interactif ? undefined : libelle}>
                {interactif ? (
                  <button
                    type="button"
                    onClick={() => setJourChoisi(cle === jourChoisi ? null : cle)}
                    aria-pressed={cle === jourChoisi}
                    aria-label={libelle}
                    className={`${classes} cursor-pointer`}
                  >
                    {jour}
                  </button>
                ) : (
                  <div className={classes}>{jour}</div>
                )}
              </li>
            );
          })}
        </ul>

        <p aria-live="polite" className="mt-3 min-h-6 text-sm text-[#222222]">
          {choix === "tous" && jourChoisi
            ? libresLe(jourChoisi).length > 0
              ? t("libresCeJour", {
                  date: dateLongue(jourChoisi),
                  liste: libresLe(jourChoisi)
                    .map((s) => s.nom)
                    .join(", "),
                })
              : t("aucunLibre", { date: dateLongue(jourChoisi) })
            : ""}
        </p>

        <ul className="mt-2 flex flex-wrap gap-4 text-xs text-gray-600">
          <li className="flex items-center gap-2">
            <span
              className={`h-4 w-4 rounded ${CLASSES.libre}`}
              aria-hidden="true"
            />
            {t("libre")}
          </li>
          {choix === "tous" && plusieurs && (
            <li className="flex items-center gap-2">
              <span
                className={`h-4 w-4 rounded ${CLASSES.partiel}`}
                aria-hidden="true"
              />
              {t("partiel")}
            </li>
          )}
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