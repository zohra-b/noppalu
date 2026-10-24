"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CLASSES_SOURCE,
  LIBELLES_SOURCE,
  SOURCES,
  estModifiable,
  type Blocage,
} from "@/lib/blocages-types";
import { nombreNuits } from "@/lib/sejour";
import FormulaireBlocage from "./FormulaireBlocage";

type Studio = { slug: string; nom: string };

type Ouverture =
  | { type: "nouveau"; cle: number; studio?: string; arrivee?: string }
  | { type: "modifier"; id: string };

const MOIS_ARRIERE = 12; // on peut remonter d'un an
const MOIS_AVANT = 24; // et avancer de deux ans

const LIBRE = "bg-[#2F6036]/10";

const pad = (n: number) => String(n).padStart(2, "0");
// `mois` va de 0 (janvier) à 11 (décembre)
const cleJour = (annee: number, mois: number, jour: number) =>
  `${annee}-${pad(mois + 1)}-${pad(jour)}`;

const formatLong = new Intl.DateTimeFormat("fr", {
  dateStyle: "long",
  timeZone: "UTC",
});
const dateLongue = (cle: string) => {
  const [a, m, j] = cle.split("-").map(Number);
  return formatLong.format(new Date(Date.UTC(a, m - 1, j)));
};

const CLASSE_FLECHE =
  "flex h-9 w-9 items-center justify-center rounded-md text-xl text-[#2F6036] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent";

// Semaine commençant le lundi (le 1er janvier 2024 était un lundi)
const entetes = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat("fr", { weekday: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, 0, 1 + i)),
  ),
);

type Props = {
  studios: Studio[];
  blocages: Blocage[];
  aujourdhui: string; // AAAA-MM-JJ, calculé par le serveur
};

export default function CalendrierAdmin({
  studios,
  blocages,
  aujourdhui,
}: Props) {
  const [decalage, setDecalage] = useState(0); // 0 = mois en cours
  const [choix, setChoix] = useState("tous");
  const [jourChoisi, setJourChoisi] = useState<string | null>(null);
  const [formulaire, setFormulaire] = useState<Ouverture | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (studios.length === 0) {
    return <p className="text-gray-600">Aucun studio n&apos;est enregistré.</p>;
  }

  const plusieurs = studios.length > 1;
  const concernes =
    choix === "tous" ? studios : studios.filter((s) => s.slug === choix);
  const noms = new Map(studios.map((s) => [s.slug, s.nom]));

  function blocageLe(slug: string, jour: string): Blocage | undefined {
    return blocages.find(
      (b) => b.studioSlug === slug && b.debut <= jour && jour < b.fin,
    );
  }

  function resume(jour: string): string {
    return concernes
      .map((s) => {
        const b = blocageLe(s.slug, jour);
        return `${s.nom} : ${b ? LIBELLES_SOURCE[b.source] : "libre"}`;
      })
      .join(", ");
  }

  function changerMois(delta: number) {
    setDecalage((d) => d + delta);
    setJourChoisi(null);
  }

  function ouvrirNouveau() {
    setMessage(null);
    setFormulaire({
      type: "nouveau",
      cle: Date.now(),
      studio: choix !== "tous" ? choix : undefined,
      arrivee: jourChoisi ?? undefined,
    });
  }

  function terminer(texte: string) {
    setFormulaire(null);
    setMessage(texte);
  }

  const [anneeJ, moisJ] = aujourdhui.split("-").map(Number);
  const indexBase = anneeJ * 12 + (moisJ - 1) + decalage;

  const options = [{ slug: "tous", nom: "Tous" }, ...studios];

  const aVenir = blocages.filter(
    (b) => b.fin > aujourdhui && (choix === "tous" || b.studioSlug === choix),
  );

  // `position` 0 = mois de gauche (toujours visible), 1 = mois de droite (ordinateur seulement)
  function mois(position: 0 | 1) {
    const index = indexBase + position;
    const annee = Math.floor(index / 12);
    const m = index % 12;

    const titreBrut = new Intl.DateTimeFormat("fr", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(annee, m, 1)));
    const titre = titreBrut.charAt(0).toUpperCase() + titreBrut.slice(1);

    const casesVides = (new Date(Date.UTC(annee, m, 1)).getUTCDay() + 6) % 7;
    const nbJours = new Date(Date.UTC(annee, m + 1, 0)).getUTCDate();

    return (
      <div
        className={
          position === 1
            ? "hidden md:block md:w-72 lg:w-96"
            : "md:w-72 lg:w-96"
        }
      >
        <div className="mb-2 flex items-center justify-between">
          {position === 0 ? (
            <button
              type="button"
              onClick={() => changerMois(-1)}
              disabled={decalage <= -MOIS_ARRIERE}
              aria-label="Mois précédent"
              className={CLASSE_FLECHE}
            >
              ‹
            </button>
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
              {/* Sur téléphone, la flèche « suivant » est ici ; sur ordinateur, au-dessus du mois de droite */}
              <button
                type="button"
                onClick={() => changerMois(1)}
                disabled={decalage >= MOIS_AVANT}
                aria-label="Mois suivant"
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
              disabled={decalage + 1 >= MOIS_AVANT}
              aria-label="Mois suivant"
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
            const passee = cle < aujourdhui;
            const anneau =
              cle === jourChoisi
                ? "ring-2 ring-[#222222]"
                : cle === aujourdhui
                  ? "ring-2 ring-[#2F6036]"
                  : "";

            return (
              <li key={cle}>
                <button
                  type="button"
                  onClick={() => setJourChoisi(cle === jourChoisi ? null : cle)}
                  aria-pressed={cle === jourChoisi}
                  aria-label={`${dateLongue(cle)}. ${resume(cle)}`}
                  className={`flex aspect-square w-full flex-col justify-between rounded-md bg-white p-1 text-left text-xs lg:p-1.5 lg:text-sm ${anneau} ${passee ? "opacity-60" : ""}`}
                >
                  <span>{jour}</span>
                  <span className="flex flex-col gap-0.5">
                    {concernes.map((s) => {
                      const b = blocageLe(s.slug, cle);
                      return (
                        <span
                          key={s.slug}
                          className={`block rounded-sm ${
                            choix === "tous" ? "h-1.5 lg:h-2" : "h-3 lg:h-4"
                          } ${b ? CLASSES_SOURCE[b.source] : LIBRE}`}
                        />
                      );
                    })}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg bg-[#FFFEF6] p-5 shadow-sm md:p-6">
        {message && (
          <p
            role="status"
            className="mb-4 rounded-md bg-[#2F6036]/10 p-3 text-sm text-green"
          >
            {message}
          </p>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {plusieurs ? (
            <div
              role="group"
              aria-label="Studio affiché"
              className="flex flex-wrap gap-2"
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
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={ouvrirNouveau}
            className="rounded-md bg-green px-4 py-1.5 text-sm font-medium text-linen transition-colors hover:bg-[#244D2B]"
          >
            + Nouveau blocage
          </button>
        </div>

        {formulaire?.type === "nouveau" && (
          <div className="mb-5">
            <FormulaireBlocage
              key={formulaire.cle}
              studios={studios}
              aujourdhui={aujourdhui}
              initial={{ studio: formulaire.studio, arrivee: formulaire.arrivee }}
              onSucces={terminer}
              onAnnuler={() => setFormulaire(null)}
            />
          </div>
        )}

        {choix === "tous" && plusieurs && (
          <p className="mb-4 text-xs text-gray-600">
            Les lignes colorées de chaque jour correspondent, de haut en bas, à :{" "}
            {studios.map((s) => s.nom).join(", ")}. Chaque jour représente la
            nuit qui commence ce jour-là.
          </p>
        )}

        <div className="md:flex md:justify-evenly">
          {mois(0)}
          {mois(1)}
        </div>

        {jourChoisi && (
          <div className="mt-5 rounded-md bg-white p-4 text-sm">
            <p className="mb-2 font-medium text-green">
              Nuit du {dateLongue(jourChoisi)}
            </p>
            <ul className="space-y-2">
              {concernes.map((s) => {
                const b = blocageLe(s.slug, jourChoisi);
                return (
                  <li key={s.slug}>
                    <span className="font-medium">{s.nom}</span> :{" "}
                    {b ? (
                      <>
                        {LIBELLES_SOURCE[b.source]}
                        {b.nom ? `, ${b.nom}` : ""} (du {dateLongue(b.debut)} au{" "}
                        {dateLongue(b.fin)})
                        {b.demandeId && (
                          <>
                            {" "}
                            <Link
                              href={`/admin/demandes/${b.demandeId}`}
                              className="text-green underline underline-offset-4"
                            >
                              Voir la demande
                            </Link>
                          </>
                        )}
                      </>
                    ) : (
                      "libre"
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600">
          <li className="flex items-center gap-2">
            <span className={`h-3 w-5 rounded-sm ${LIBRE}`} aria-hidden="true" />
            Libre
          </li>
          {SOURCES.map((s) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={`h-3 w-5 rounded-sm ${CLASSES_SOURCE[s]}`}
                aria-hidden="true"
              />
              {LIBELLES_SOURCE[s]}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-xl font-semibold text-green">
          Blocages en cours et à venir
        </h2>
        {aVenir.length === 0 ? (
          <p className="text-sm text-gray-600">Aucun blocage.</p>
        ) : (
          <ul className="space-y-3">
            {aVenir.map((b) => {
              const n = nombreNuits(b.debut, b.fin);
              const enModification =
                formulaire?.type === "modifier" && formulaire.id === b.id;

              return (
                <li
                  key={b.id}
                  className="rounded-lg bg-[#FFFEF6] p-4 text-sm shadow-sm"
                >
                  {enModification ? (
                    <FormulaireBlocage
                      studios={studios}
                      aujourdhui={aujourdhui}
                      blocage={b}
                      onSucces={terminer}
                      onAnnuler={() => setFormulaire(null)}
                    />
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-green">
                          {noms.get(b.studioSlug) ?? b.studioSlug}
                        </span>
                        <span className="flex shrink-0 items-center gap-2 text-xs">
                          <span
                            className={`h-3 w-3 rounded-sm ${CLASSES_SOURCE[b.source]}`}
                            aria-hidden="true"
                          />
                          {LIBELLES_SOURCE[b.source]}
                        </span>
                      </div>
                      <p className="mt-1">
                        du {dateLongue(b.debut)} au {dateLongue(b.fin)} · {n} nuit
                        {n > 1 ? "s" : ""}
                      </p>
                      {b.nom && <p className="text-gray-600">{b.nom}</p>}
                      {(b.email || b.telephone) && (
                        <p className="text-gray-600">
                          {[b.email, b.telephone].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {b.note && <p className="text-gray-600">{b.note}</p>}

                      {estModifiable(b) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMessage(null);
                            setFormulaire({ type: "modifier", id: b.id });
                          }}
                          className="mt-2 rounded-md border border-green px-4 py-1.5 text-sm font-medium text-green transition-colors hover:bg-green hover:text-linen"
                        >
                          Modifier
                        </button>
                      ) : (
                        b.demandeId && (
                          <Link
                            href={`/admin/demandes/${b.demandeId}`}
                            className="mt-1 inline-block text-green underline underline-offset-4"
                          >
                            Voir la demande
                          </Link>
                        )
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}