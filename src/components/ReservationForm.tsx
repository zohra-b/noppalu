"use client";

import {
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/Button";
import Calendrier from "@/components/Calendrier";
import { Link } from "@/i18n/navigation";
import type { Periode } from "@/lib/data";
import { prixDuSejour, type Tarifs } from "@/lib/saisons";
import {
  REGLES,
  ajouterJours,
  aujourdhuiSenegal,
  dateValide,
  etatDate,
  nombreNuits,
  validerSejour,
} from "@/lib/sejour";
import { suggererEmail, validerEmail } from "@/lib/validation";

type Studio = {
  slug: string;
  nom: string;
  capacite: number;
  litCm: number;
  resume: string | null;
};

type Statut = "repos" | "envoi" | "succes" | "erreur";

type Props = {
  studios: Studio[];
  periodesParStudio: Record<string, Periode[]>;
  tarifs: Tarifs | null; // null = prix masqués
  aujourdhui: string; // AAAA-MM-JJ, calculé par le serveur
};

const CODES_CONNUS = [
  "nom_invalide",
  "email_vide",
  "email_trop_long",
  "email_invalide",
  "telephone_invalide",
  "message_trop_long",
  "studio_inconnu",
  "studio_indisponible",
  "dates_invalides",
  "depart_avant_arrivee",
  "arrivee_trop_proche",
  "arrivee_trop_lointaine",
  "sejour_trop_court",
  "sejour_trop_long",
  "voyageurs_invalides",
  "requete_invalide",
  "envoi_echoue",
  "timeout",
  "reseau",
];

const CLASSE_CHAMP =
  "w-full rounded-md border border-[#C6B06B] bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green aria-[invalid=true]:border-red-700";
const CLASSE_CARTE = "rounded-lg bg-[#FFFEF6] p-6 shadow-sm md:p-8";

// Date du jour (Sénégal) côté navigateur. Pendant le premier affichage, on utilise
// celle du serveur pour éviter tout décalage d'hydratation, puis on bascule.
const sansAbonnement = () => () => {};

export default function ReservationForm({
  studios,
  periodesParStudio,
  tarifs,
  aujourdhui: aujourdhuiServeur,
}: Props) {
  const t = useTranslations("Reservation");
  const locale = useLocale();
  const params = useSearchParams();

  const local = useSyncExternalStore<string | null>(
    sansAbonnement,
    aujourdhuiSenegal,
    () => null,
  );
  const aujourdhui = local ?? aujourdhuiServeur;

  const maxCapacite = Math.max(...studios.map((s) => s.capacite));

  // Valeurs de départ éventuelles, lues dans l'adresse
  const studioParam = params.get("studio") ?? "";
  const preference = studios.some((s) => s.slug === studioParam)
    ? studioParam
    : "";
  const dateParam = (cle: string) => {
    const v = params.get(cle) ?? "";
    return dateValide(v) ? v : "";
  };

  const [arrivee, setArrivee] = useState(() => dateParam("arrivee"));
  const [depart, setDepart] = useState(() => dateParam("depart"));
  const [voyageurs, setVoyageurs] = useState(Math.min(2, maxCapacite));
  const [choix, setChoix] = useState(preference);
  const [champActif, setChampActif] = useState<"arrivee" | "depart" | null>(
    null,
  );
  const [champs, setChamps] = useState({
    nom: "",
    email: "",
    telephone: "",
    message: "",
  });
  const [statut, setStatut] = useState<Statut>("repos");
  const [codeErreur, setCodeErreur] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  const [codeErreurEmail, setCodeErreurEmail] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const erreurTexte = (code: string) =>
    t(`erreurs.${code}`, { min: REGLES.nuitsMin, max: REGLES.nuitsMax });

  const messageEmail = !codeErreurEmail
    ? ""
    : codeErreurEmail === "suggestion"
      ? t("erreurs.email_suggestion", { adresse: suggestion ?? "" })
      : erreurTexte(codeErreurEmail);

  // Calculs dérivés (rien n'est stocké en double)
  const minArrivee = ajouterJours(aujourdhui, REGLES.delaiMinJours);
  const minDepart = dateValide(arrivee)
    ? ajouterJours(arrivee, REGLES.nuitsMin)
    : minArrivee;

  // Une date est « en erreur » si elle est complète mais impossible (1111, 2150…),
  // ou si l'année est restée incomplète une fois le champ quitté.
  // Pendant la frappe de l'année, on ne dit rien.
  const dateEnErreur = (cle: "arrivee" | "depart", valeur: string) => {
    const etat = etatDate(valeur);
    return etat === "invalide" || (etat === "en_cours" && champActif !== cle);
  };
  const arriveeEnErreur = dateEnErreur("arrivee", arrivee);
  const departEnErreur = dateEnErreur("depart", depart);

  // Les calculs n'ont lieu que sur des dates complètes et plausibles
  const datesSaisies = dateValide(arrivee) && dateValide(depart);
  const erreurSejour = datesSaisies
    ? validerSejour(
        { arrivee, depart, voyageurs, capacite: maxCapacite },
        aujourdhui,
      )
    : null;
  const datesValides = datesSaisies && erreurSejour === null;
  const nuits = datesValides ? nombreNuits(arrivee, depart) : 0;

  const estLibre = (s: Studio) =>
    s.capacite >= voyageurs &&
    !(periodesParStudio[s.slug] ?? []).some(
      (p) => p.debut < depart && p.fin > arrivee,
    );

  const libres = datesValides ? studios.filter(estLibre) : [];

  // Studio retenu : celui qui est coché s'il est libre, sinon l'unique studio libre
  const choisi =
    libres.find((s) => s.slug === choix) ??
    (libres.length === 1 ? libres[0] : null);

  // Le studio choisi (ou préféré) n'est pas libre sur les dates saisies
  const notePreference =
    datesValides &&
    choix !== "" &&
    libres.length > 0 &&
    !libres.some((s) => s.slug === choix);

  const total =
    tarifs && datesValides ? prixDuSejour(arrivee, depart, tarifs) : null;

  const dateLongue = (cle: string) => {
    const [a, m, j] = cle.split("-").map(Number);
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(a, m - 1, j)));
  };

  function changerArrivee(valeur: string) {
    setArrivee(valeur);
    // Propose un départ à la durée minimale si le départ est vide ou trop proche
    if (
      dateValide(valeur) &&
      (!dateValide(depart) || depart < ajouterJours(valeur, REGLES.nuitsMin))
    ) {
      setDepart(ajouterJours(valeur, REGLES.nuitsMin));
    }
  }

  function modifier(cle: keyof typeof champs, valeur: string) {
    setChamps((c) => ({ ...c, [cle]: valeur }));
    if (cle === "email" && codeErreurEmail) {
      setCodeErreurEmail("");
      setSuggestion(null);
    }
  }

  function corrigerEmail() {
    if (suggestion) setChamps((c) => ({ ...c, email: suggestion }));
    setCodeErreurEmail("");
    setSuggestion(null);
  }

  async function envoyer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!choisi || statut === "envoi") return;

    const formulaire = event.currentTarget;
    const email = champs.email.trim();

    const probleme = validerEmail(email);
    const corrige = probleme ? null : suggererEmail(email);
    if (probleme || corrige) {
      setCodeErreurEmail(probleme ?? "suggestion");
      setSuggestion(corrige);
      emailRef.current?.focus();
      return;
    }

    setCodeErreurEmail("");
    setSuggestion(null);
    setStatut("envoi");
    setCodeErreur("");

    try {
      const controleur = new AbortController();
      const minuteur = setTimeout(() => controleur.abort(), 15000);

      const res = await fetch("/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: choisi.slug,
          arrivee,
          depart,
          voyageurs,
          nom: champs.nom.trim(),
          email,
          telephone: champs.telephone.trim(),
          message: champs.message.trim(),
          website: String(new FormData(formulaire).get("website") ?? ""),
          locale,
        }),
        signal: controleur.signal,
      }).finally(() => clearTimeout(minuteur));

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setCodeErreur(
          typeof json.error === "string" ? json.error : "envoi_echoue",
        );
        setStatut("erreur");
        return;
      }
      setStatut("succes");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setCodeErreur(
        err instanceof DOMException && err.name === "AbortError"
          ? "timeout"
          : "reseau",
      );
      setStatut("erreur");
    }
  }

  if (statut === "succes") {
    return (
      <section role="status" className={CLASSE_CARTE}>
        <h2 className="mb-4 font-serif text-2xl text-green">
          {t("succesTitre")}
        </h2>
        <p className="mb-3 leading-7">
          {t("succesTexte", { nom: champs.nom.trim() })}
        </p>
        <p className="mb-3 leading-7">
          {t("succesEmail", { email: champs.email.trim() })}
        </p>
        <p className="mb-6 text-sm leading-6 text-gray-600">
          {t("succesRappel")}
        </p>
        <Button href="/">{t("retourAccueil")}</Button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Disponibilités : même calendrier que sur les pages studios */}
      <Calendrier
        studios={studios}
        periodesParStudio={periodesParStudio}
        aujourdhui={aujourdhui}
        variante="reservation"
      />

      {/* 1. Dates */}
      <section className={CLASSE_CARTE}>
        <h2 className="mb-4 font-serif text-2xl text-green">
          {t("etapeDates")}
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="arrivee"
              className="mb-1 block text-sm font-medium"
            >
              {t("arrivee")}
            </label>
            <input
              id="arrivee"
              type="date"
              value={arrivee}
              min={minArrivee}
              onChange={(e) => changerArrivee(e.target.value)}
              onFocus={() => setChampActif("arrivee")}
              onBlur={() => setChampActif(null)}
              aria-invalid={arriveeEnErreur}
              className={CLASSE_CHAMP}
            />
          </div>

          <div>
            <label htmlFor="depart" className="mb-1 block text-sm font-medium">
              {t("depart")}
            </label>
            <input
              id="depart"
              type="date"
              value={depart}
              min={minDepart}
              onChange={(e) => setDepart(e.target.value)}
              onFocus={() => setChampActif("depart")}
              onBlur={() => setChampActif(null)}
              aria-invalid={departEnErreur}
              className={CLASSE_CHAMP}
            />
          </div>

          <div>
            <label
              htmlFor="voyageurs"
              className="mb-1 block text-sm font-medium"
            >
              {t("voyageurs")}
            </label>
            <select
              id="voyageurs"
              value={voyageurs}
              onChange={(e) => setVoyageurs(Number(e.target.value))}
              className={CLASSE_CHAMP}
            >
              {Array.from({ length: maxCapacite }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p aria-live="polite" className="mt-3 min-h-6 text-sm">
          {arriveeEnErreur || departEnErreur ? (
            <span className="text-red-700">{erreurTexte("dates_invalides")}</span>
          ) : erreurSejour ? (
            <span className="text-red-700">{erreurTexte(erreurSejour)}</span>
          ) : datesValides ? (
            t("nuits", { n: nuits })
          ) : (
            ""
          )}
        </p>
      </section>

      {/* 2. Choix du studio : toujours visible. Avant les dates, état neutre ;
          ensuite les studios occupés sont grisés et non sélectionnables. */}
      <section className={CLASSE_CARTE}>
        <h2 className="mb-2 font-serif text-2xl text-green">
          {t("etapeStudio")}
        </h2>

        {!datesValides && (
          <p className="mb-4 text-sm leading-6 text-gray-600">
            {t("etapeStudioAide")}
          </p>
        )}

        {datesValides && libres.length === 0 && (
          <div className="mb-4">
            <p className="mb-3 leading-7">{t("aucunStudio")}</p>
            <Link
              href="/contact"
              className="font-medium text-green underline underline-offset-4 hover:text-sand"
            >
              {t("contact")}
            </Link>
          </div>
        )}

        {notePreference && (
          <p className="mb-4 text-sm leading-6 text-[#8B3017]">
            {t("preferenceIndisponible")}
          </p>
        )}

        <fieldset className="space-y-3">
          <legend className="sr-only">{t("etapeStudio")}</legend>
          {studios.map((s) => {
            // Sans dates valides, aucun studio n'est présenté comme occupé
            const libre = !datesValides || estLibre(s);
            const actif = datesValides
              ? choisi?.slug === s.slug
              : choix === s.slug;
            return (
              <label
                key={s.slug}
                className={`flex items-start gap-3 rounded-md border-2 p-4 transition-colors ${
                  actif
                    ? "cursor-pointer border-[#2F6036] bg-[#C6B06B]/50 shadow-sm"
                    : libre
                      ? "cursor-pointer border-[#C6B06B] bg-white hover:bg-[#FFFEF6]"
                      : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500"
                }`}
              >
                <input
                  type="radio"
                  name="studio"
                  value={s.slug}
                  checked={actif}
                  disabled={!libre}
                  onChange={() => setChoix(s.slug)}
                  className="mt-1 accent-[#2F6036]"
                />
                <span className="flex-1">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`font-semibold ${
                        libre ? "text-green" : "text-gray-500"
                      }`}
                    >
                      {s.nom}
                    </span>
                    {actif && (
                      <span className="rounded-full bg-[#2F6036] px-2.5 py-0.5 text-xs font-medium text-white">
                        {t("studioSelectionne")}
                      </span>
                    )}
                    {!libre && (
                      <span className="rounded-full bg-gray-300 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        {t("studioIndisponible")}
                      </span>
                    )}
                  </span>
                  <span
                    className={`block text-sm ${
                      libre ? "text-gray-600" : "text-gray-500"
                    }`}
                  >
                    {t("lit", { cm: s.litCm })}
                  </span>
                  {s.resume && (
                    <span className="mt-1 block text-sm leading-6">
                      {s.resume}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </fieldset>
      </section>

      {/* 3. Coordonnées, récapitulatif et envoi */}
      {choisi && (
        <section className={CLASSE_CARTE}>
          <h2 className="mb-6 font-serif text-2xl text-green">
            {t("etapeCoordonnees")}
          </h2>

          <form onSubmit={envoyer} className="space-y-5">
            <div>
              <label htmlFor="nom" className="mb-1 block text-sm font-medium">
                {t("nom")}
              </label>
              <input
                id="nom"
                type="text"
                autoComplete="name"
                required
                value={champs.nom}
                onChange={(e) => modifier("nom", e.target.value)}
                className={CLASSE_CHAMP}
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                {t("email")}
              </label>
              <input
                ref={emailRef}
                id="email"
                type="email"
                autoComplete="email"
                required
                value={champs.email}
                onChange={(e) => modifier("email", e.target.value)}
                aria-invalid={!!codeErreurEmail}
                aria-describedby={codeErreurEmail ? "email-erreur" : undefined}
                className={CLASSE_CHAMP}
              />
              {codeErreurEmail && (
                <p
                  id="email-erreur"
                  role="alert"
                  className="mt-1 text-sm text-red-700"
                >
                  {messageEmail}{" "}
                  {suggestion && (
                    <button
                      type="button"
                      onClick={corrigerEmail}
                      className="font-medium underline underline-offset-2"
                    >
                      {t("corriger")}
                    </button>
                  )}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="telephone"
                className="mb-1 block text-sm font-medium"
              >
                {t("telephone")}
              </label>
              <input
                id="telephone"
                type="tel"
                autoComplete="tel"
                placeholder={t("telephonePlaceholder")}
                value={champs.telephone}
                onChange={(e) => modifier("telephone", e.target.value)}
                className={CLASSE_CHAMP}
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="mb-1 block text-sm font-medium"
              >
                {t("message")}
              </label>
              <textarea
                id="message"
                rows={4}
                maxLength={2000}
                placeholder={t("messagePlaceholder")}
                value={champs.message}
                onChange={(e) => modifier("message", e.target.value)}
                className={`${CLASSE_CHAMP} resize-y`}
              />
            </div>

            <div aria-hidden="true" className="absolute left-[-9999px]">
              <label htmlFor="website">{t("antispam")}</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#2F6036]">
                {t("recapTitre")}
              </h3>
              <dl className="divide-y divide-[#C6B06B]/40 rounded-lg bg-white text-sm shadow-sm">
                {[
                  [t("studio"), choisi.nom],
                  [t("arrivee"), dateLongue(arrivee)],
                  [t("depart"), dateLongue(depart)],
                  [t("duree"), t("nuits", { n: nuits })],
                  [t("voyageurs"), String(voyageurs)],
                  ...(total !== null
                    ? [
                        [
                          t("estimation"),
                          t("prixFcfa", {
                            prix: new Intl.NumberFormat(locale).format(total),
                          }),
                        ],
                      ]
                    : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-4 py-2">
                    <dt>{k}</dt>
                    <dd className="text-right font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              {total !== null && (
                <p className="mt-2 text-xs text-gray-600">
                  {t("estimationNote")}
                </p>
              )}
            </div>

            <p className="text-xs text-gray-600">{t("mention")}</p>

            <Button
              type="submit"
              className="w-full"
              disabled={statut === "envoi"}
            >
              {statut === "envoi" ? t("envoiEnCours") : t("envoyer")}
            </Button>

            {statut === "erreur" && (
              <div role="alert" className="space-y-2 text-sm text-red-700">
                <p>
                  {erreurTexte(
                    CODES_CONNUS.includes(codeErreur)
                      ? codeErreur
                      : "envoi_echoue",
                  )}
                </p>
                <a
                  href="https://wa.me/34637251773"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-4"
                >
                  {t("whatsapp")}
                </a>
              </div>
            )}
          </form>
        </section>
      )}

      <p className="text-center text-sm">
        {t("autreQuestion")}{" "}
        <Link
          href="/contact"
          className="font-medium text-green underline underline-offset-4 hover:text-sand"
        >
          {t("contact")}
        </Link>
      </p>
    </div>
  );
}