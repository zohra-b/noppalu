"use client";

import { useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/Button";
import { suggererEmail, validerEmail } from "@/lib/validation";

type Statut = "repos" | "envoi" | "succes" | "erreur";

export default function ContactPage() {
  const t = useTranslations("Contact");

  const [statut, setStatut] = useState<Statut>("repos");
  const [codeErreur, setCodeErreur] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  const [codeErreurEmail, setCodeErreurEmail] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const messageErreurEmail = !codeErreurEmail
    ? ""
    : codeErreurEmail === "suggestion"
      ? t("erreurs.email_suggestion", { adresse: suggestion ?? "" })
      : t(`erreurs.${codeErreurEmail}`);

  const CODES_CONNUS = [
    "nom_invalide",
    "telephone_invalide",
    "message_invalide",
    "requete_invalide",
    "email_vide",
    "email_trop_long",
    "email_invalide",
    "envoi_echoue",
    "timeout",
    "reseau",
  ];
  const messageErreur = t(
    `erreurs.${CODES_CONNUS.includes(codeErreur) ? codeErreur : "envoi_echoue"}`,
  );

  function corrigerEmail() {
    if (emailRef.current && suggestion) emailRef.current.value = suggestion;
    setCodeErreurEmail("");
    setSuggestion(null);
  }

  async function envoyerMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formulaire = event.currentTarget;
    const donnees = Object.fromEntries(new FormData(formulaire));

    const email = String(donnees.email ?? "").trim();
    donnees.email = email;

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

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donnees),
        signal: controleur.signal,
      }).finally(() => clearTimeout(minuteur));

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setCodeErreur(typeof json.error === "string" ? json.error : "envoi_echoue");
        setStatut("erreur");
        return;
      }
      formulaire.reset();
      setStatut("succes");
    } catch (err) {
      setCodeErreur(
        err instanceof DOMException && err.name === "AbortError"
          ? "timeout"
          : "reseau",
      );
      setStatut("erreur");
    }
  }

  return (
    <main className="flex-1 bg-linen px-6 py-2 text-[#222222]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <h1 className="mb-4 font-serif text-3xl font-semibold text-green md:text-4xl">
            {t("titre")}
          </h1>
          <p className="mx-auto max-w-1xl">{t("intro")}</p>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Formulaire */}
          <section className="rounded-lg bg-[#FFFEF6] p-6 shadow-sm md:p-8">
            <h2 className="mb-6 font-serif text-2xl text-green">
              {t("formulaire.titre")}
            </h2>

            <form onSubmit={envoyerMessage} className="space-y-5">
              <div>
                <label htmlFor="nom" className="mb-1 block text-sm font-medium">
                  {t("formulaire.nom")}
                </label>
                <input
                  id="nom"
                  name="nom"
                  type="text"
                  autoComplete="name"
                  required
                  className="w-full rounded-md border border-[#C6B06B] bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium">
                  {t("formulaire.email")}
                </label>
                <input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-invalid={!!codeErreurEmail}
                  aria-describedby={codeErreurEmail ? "email-erreur" : undefined}
                  onChange={() => {
                    if (codeErreurEmail) {
                      setCodeErreurEmail("");
                      setSuggestion(null);
                    }
                  }}
                  className="w-full rounded-md border border-[#C6B06B] bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green aria-[invalid=true]:border-red-700"
                />
                {codeErreurEmail && (
                  <p id="email-erreur" role="alert" className="mt-1 text-sm text-red-700">
                    {messageErreurEmail}{" "}
                    {suggestion && (
                      <button
                        type="button"
                        onClick={corrigerEmail}
                        className="font-medium underline underline-offset-2"
                      >
                        {t("formulaire.corriger")}
                      </button>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="telephone" className="mb-1 block text-sm font-medium">
                  {t("formulaire.telephone")}
                </label>
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  autoComplete="tel"
                  placeholder={t("formulaire.telephonePlaceholder")}
                  className="w-full rounded-md border border-[#C6B06B] bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green"
                />
              </div>

              <div>
                <label htmlFor="objet" className="mb-1 block text-sm font-medium">
                  {t("formulaire.objet")}
                </label>
                <select
                  id="objet"
                  name="objet"
                  defaultValue="disponibilites"
                  className="w-full rounded-md border border-[#C6B06B] bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green"
                >
                  <option value="disponibilites">{t("objets.disponibilites")}</option>
                  <option value="bungalow">{t("objets.bungalow")}</option>
                  <option value="infos">{t("objets.infos")}</option>
                  <option value="autre">{t("objets.autre")}</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="mb-1 block text-sm font-medium">
                  {t("formulaire.message")}
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder={t("formulaire.messagePlaceholder")}
                  className="w-full resize-y rounded-md border border-[#C6B06B] bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green"
                />
              </div>

              <div aria-hidden="true" className="absolute left-[-9999px]">
                <label htmlFor="website">{t("formulaire.antispam")}</label>
                <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <p className="text-xs text-gray-600">{t("formulaire.mention")}</p>

              <Button type="submit" className="w-full" disabled={statut === "envoi"}>
                {statut === "envoi"
                  ? t("formulaire.envoiEnCours")
                  : t("formulaire.envoyer")}
              </Button>

              {statut === "succes" && (
                <p role="status" className="text-sm text-green">
                  {t("formulaire.succes")}
                </p>
              )}
              {statut === "erreur" && (
                <div role="alert" className="space-y-2 text-sm text-red-700">
                  <p>{messageErreur}</p>
                  <a
                    href="https://wa.me/34637251773"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-4"
                  >
                    {t("formulaire.whatsappErreur")}
                  </a>
                </div>
              )}
            </form>
          </section>

          {/* Coordonnées */}
          <div className="space-y-8">
            <section className="rounded-lg bg-[#FFFEF6] p-6 shadow-sm md:p-8">
              <h2 className="mb-5 font-serif text-2xl text-green">
                {t("coordonnees.titre")}
              </h2>

              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold">{t("coordonnees.email")}</h3>
                  <a
                    href="mailto:contact@casanoppalu.com"
                    className="break-all text-green underline underline-offset-4"
                  >
                    contact@casanoppalu.com
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold">{t("coordonnees.whatsapp")}</h3>
                  <p className="mb-3">+34 637 251 773</p>
                  <Button href="https://wa.me/34637251773" target="_blank">
                    {t("coordonnees.boutonWhatsapp")}
                  </Button>
                </div>

                <div>
                  <h3 className="font-semibold">{t("coordonnees.adresse")}</h3>
                  <p>Casa Noppalu</p>
                  <p>Piste des Charrettes, Angle Serigne Falou - Saly Niakhnakhal</p>
                </div>
              </div>
            </section>

            {/* Carte Google Maps */}
            <section className="overflow-hidden rounded-lg bg-[#FFFEF6] shadow-sm">
              <div className="p-6">
                <h2 className="mb-2 font-serif text-2xl text-green">
                  {t("itineraire.titre")}
                </h2>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=C2J3%2BF9W%20Mbour%20Senegal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-green underline underline-offset-4"
                >
                  {t("itineraire.ouvrir")}
                </a>
              </div>

              <iframe
                title={t("itineraire.carteTitre")}
                src="https://maps.google.com/maps?q=C2J3%2BF9W%20Mbour%20Senegal&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="h-72 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}