
"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/Button";

type Statut = "repos" | "envoi" | "succes" | "erreur";

export default function ContactPage() {
  const [statut, setStatut] = useState<Statut>("repos");
  const [erreur, setErreur] = useState("");

  async function envoyerMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatut("envoi");
    setErreur("");

    const formulaire = event.currentTarget;
    const donnees = Object.fromEntries(new FormData(formulaire));

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donnees),
      });
      const json = await res.json();

      if (!res.ok) {
        setErreur(json.error ?? "Une erreur est survenue.");
        setStatut("erreur");
        return;
      }
      formulaire.reset();
      setStatut("succes");
    } catch {
      setErreur("Connexion impossible. Réessayez dans un instant.");
      setStatut("erreur");
    }
  }

  return (
    <main className="flex-1 bg-linen px-6 py-2 text-[#222222]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <h1 className="mb-4 font-serif text-3xl font-semibold text-green md:text-4xl">
            Contact
          </h1>
          <p className="mx-auto max-w-2xl">
            Une question sur Casa Noppalu ou sur nos bungalows ?
            Écrivez-nous, nous vous répondrons avec plaisir.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Formulaire */}
          <section className="rounded-lg bg-[#FFFEF6] p-6 shadow-sm md:p-8">
            <h2 className="mb-6 font-serif text-2xl text-green">
              Envoyez-nous un message
            </h2>

            <form onSubmit={envoyerMessage} className="space-y-5">
              <div>
                <label htmlFor="nom" className="mb-1 block text-sm font-medium">
                  Nom *
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
                  Adresse e-mail *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full rounded-md border border-[#C6B06B] bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green"
                />
              </div>

              <div>
                <label
                  htmlFor="telephone"
                  className="mb-1 block text-sm font-medium"
                >
                  Téléphone / WhatsApp (facultatif)
                </label>
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+33, +221, etc."
                  className="w-full rounded-md border border-[#C6B06B] bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green"
                />
              </div>

              <div>
                <label htmlFor="objet" className="mb-1 block text-sm font-medium">
                  Objet de votre demande
                </label>
                <select
                  id="objet"
                  name="objet"
                  defaultValue="Disponibilités"
                  className="w-full rounded-md border border-[#C6B06B] bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green"
                >
                  <option>Disponibilités</option>
                  <option>Question sur un bungalow</option>
                  <option>Informations pratiques</option>
                  <option>Autre demande</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-1 block text-sm font-medium"
                >
                  Votre message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Comment pouvons-nous vous aider ?"
                  className="w-full resize-y rounded-md border border-[#C6B06B] bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-green"
                />
              </div>
              <div aria-hidden="true" className="absolute left-[-9999px]">
                  <label htmlFor="website">Ne pas remplir</label>
                  <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <p className="text-xs text-gray-600">
                Les informations saisies servent à répondre à votre demande.
              </p>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={statut === "envoi"}>
                      {statut === "envoi" ? "Envoi en cours…" : "Envoyer mon message"}
              </Button>

              {statut === "succes" && (
                <p role="status" className="text-sm text-green">
                Merci, votre message a bien été envoyé. Nous vous répondrons rapidement.
                </p>
                  )}
              {statut === "erreur" && (
                <p role="alert" className="text-sm text-red-700">{erreur}</p>
                  )}
            </form>
          </section>

          {/* Coordonnées */}
          <div className="space-y-8">
            <section className="rounded-lg bg-[#FFFEF6] p-6 shadow-sm md:p-8">
              <h2 className="mb-5 font-serif text-2xl text-green">
                Nos coordonnées
              </h2>

              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold">E-mail</h3>
                  <a
                    href="mailto:contact@casanoppalu.com"
                    className="break-all text-green underline underline-offset-4"
                  >
                    contact@casanoppalu.com
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold">WhatsApp</h3>
                  <p className="mb-3">+221 76 86 63 367</p>
                 <Button
                    href="https://wa.me/221768663367"
                    target="_blank"
                    >
                    Nous contacter sur WhatsApp
                </Button>
                </div>

                <div>
                  <h3 className="font-semibold">Adresse</h3>
                  <p>Casa Noppalu</p>
                  <p>Piste des Charrettes, Angle Serigne Falou - Saly Niakhnakhal</p>
                </div>
              </div>
            </section>

            {/* Carte Google Maps */}
            <section className="overflow-hidden rounded-lg bg-[#FFFEF6] shadow-sm">
              <div className="p-6">
                <h2 className="mb-2 font-serif text-2xl text-green">
                  Itinéraire
                </h2>
                {/* <p className="mb-4 text-sm">
                  Retrouvez Casa Noppalu à Saly, au Sénégal.
                </p> */}
                <a
                  href="https://www.google.com/maps/search/?api=1&query=C2J3%2BF9W%20Mbour%20Senegal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-green underline underline-offset-4"
                >
                  Ouvrir l’itinéraire dans Google Maps
                </a>
              </div>

              <iframe
                title="Localisation de Casa Noppalu à Saly, Sénégal"
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