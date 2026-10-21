"use client";

import { useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/Button";
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

const CLASSE_FLECHE =
  "flex h-9 w-9 items-center justify-center rounded-md text-xl text-[#2F6036] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent";

type Props = {
  studios: Studio[];
  periodesParStudio: Record<string, Periode[]>;
  aujourdhui: string; // AAAA-MM-JJ, calculé par le serveur
  // "page" : pages studios (avec bouton de demande) ; "reservation" : intégré à la page de demande
  variante?: "page" | "reservation";
};

export default function Calendrier({
  studios,
  periodesParStudio,
  aujourdhui: aujourdhuiServeur,
  variante = "page",
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
  const indexBase = anneeJ * 12 + (moisJ - 1) + decalage;

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

  const options = [{ slug: "tous", nom: t("tous") }, ...studios];

  const intro =
    variante === "reservation"
      ? t("introReservation")
      : plusieurs
        ? t("introGeneral")
        : t("intro");

  const flechePrecedente = (
    <button
      type="button"
      onClick={() => changerMois(-1)}
      disabled={decalage === 0}
      aria-label={t("precedent")}
      className={CLASSE_FLECHE}
    >
      ‹
    </button>
  );

  // Un mois : en-tête avec ses flèches, jours de la semaine, grille.
  // `position` 0 = mois de gauche (toujours visible), 1 = mois de droite (ordinateur seulement).
  function mois(position: 0 | 1) {
    const index = indexBase + position;
    const annee = Math.floor(index / 12);
    const m = index % 12;

    const titreBrut = new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(annee, m, 1)));
    const titre =
      titreBrut.charAt(0).toLocaleUpperCase(locale) + titreBrut.slice(1);

    const casesVides = (new Date(Date.UTC(annee, m, 1)).getUTCDay() + 6) % 7;
    const nbJours = new Date(Date.UTC(annee, m + 1, 0)).getUTCDate();

    return (
      <div
        className={
          position === 1
            ? "hidden md:block md:w-72 lg:w-80"
            : "md:w-72 lg:w-80"
        }
      >
        <div className="mb-2 flex items-center justify-between">
          {position === 0 ? (
            flechePrecedente
          ) : (
            <span className="h-9 w-9" aria-hidden="true" />
          )}

          <p
            aria-live={position === 0 ? "polite" : undefined}
            className="font-medium text-[#2F6036]"
          >
            {titre}
          </p>

          {position === 0 ? (
            <>
              {/* Sur téléphone, la flèche « suivant » est ici ; sur ordinateur, elle est au-dessus du mois de droite */}
              <button
                type="button"
                onClick={() => changerMois(1)}
                disabled={decalage >= MOIS_MAX}
                aria-label={t("suivant")}
                className={`${CLASSE_FLECHE} md:hidden`}
              >
                ›
              </button>
              <span className="hidden h-9 w-9 md:block" aria-hidden="true" />
            </>
          ) : (
            <button
              type="button"
              onClick={() => changerMois(1)}
              disabled={decalage + 1 >= MOIS_MAX}
              aria-label={t("suivant")}
              className={CLASSE_FLECHE}
            >
              ›
            </button>
          )}
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
            const cle = cleJour(annee, m, jour);
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
      </div>
    );
  }

  return (
    <section
      className={`rounded-lg bg-[#FFFEF6] p-5 shadow-sm md:p-6 ${
        variante === "page" ? "mb-10" : ""
      }`}
    >
      <h2 className="mb-2 font-serif text-2xl text-[#2F6036]">{t("titre")}</h2>
      <p className="mb-5 text-sm leading-6 text-gray-600">{intro}</p>

      {plusieurs && (
        <div
          role="group"
          aria-label={t("choixStudio")}
          className="mb-4 flex flex-wrap gap-2"
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

      <div className="max-w-md md:max-w-none">
        {/* Sur ordinateur : espace égal à gauche, entre les deux mois et à droite */}
        <div className="md:flex md:justify-evenly">
          {mois(0)}
          {mois(1)}
        </div>

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

        <div className="mt-2 md:flex md:items-center md:justify-between md:gap-6">
          <ul className="flex flex-wrap gap-4 text-xs text-gray-600">
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

          {variante === "page" && (
            <Button
              href={
                choix === "tous"
                  ? "/reservation"
                  : `/reservation?studio=${choix}`
              }
              className="mt-5 md:mt-0"
            >
              {t("reserver")}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}