
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const photosAccueil = [
  { src: "/images/jardin1.png", alt: "Le jardin de Casa Noppalu" },
  { src: "/images/jardin2.jpg", alt: "Une adorable salamandre" },
  { src: "/images/jardin3.jpg", alt: "La terrasse pour l'apéro" },
  { src: "/images/jardin4.jpg", alt: "Un escargot nous rend visite" },
  { src: "/images/piscine1.jpg", alt: "La piscine de Casa Noppalu" },
  { src: "/images/plage.jpg", alt: "La plage à proximité" },
];

const bungalows = [
  {
    nom: "Manguier",
    photo: "/images/bungalow1.jpg",
    description: "Un espace indépendant pour profiter d'un séjour au calme.",
  },
  {
    nom: "Cocotier",
    photo: "/images/bungalow2.jpg",
    description: "Un cadre agréable pour se reposer et profiter du jardin.",
  },
  {
    nom: "Bananier",
    photo: "/images/bungalow3.jpg",
    description: "Un hébergement indépendant dans un environnement naturel.",
  },
];

export default function Home() {
  const [photoActuelle, setPhotoActuelle] = useState(0);

  function photoPrecedente() {
    setPhotoActuelle(
      (photoActuelle - 1 + photosAccueil.length) % photosAccueil.length
    );
  }

  function photoSuivante() {
    setPhotoActuelle((photoActuelle + 1) % photosAccueil.length);
  }

  return (
    <main className="flex-1">
      {/* Section 1 : accueil et carrousel */}
      <section className="px-6 py-12 md:px-12 md:py-10">
        <div className="mx-auto grid max-w-6xl items-center gap-6 md:grid-cols-1">
          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.2em] text-[#8B3017]">
              Casa Noppalu, Maison d'hôtes au Sénégal
            </p>

            <h1 className="mb-6 text-4xl font-semibold leading-tight text-[#2F6036] md:text-5xl">
              Votre pied à terre avec piscine à Saly
            </h1>

            <p className="max-w-full text-lg leading-8 text-[#222222]">
              À Saly, dans le quartier résidentiel de Niakhnakhal, Casa Noppalu vous accueille dans un cadre simple et confortable, loin des grands complexes hôteliers. Nos trois bungalows indépendants et climatisés, équipés d'une kitchenette et du wifi, vous offrent la liberté d'organiser vos journées à votre rythme, tout en profitant de la piscine, du jardin et de la plage, accessible en dix minutes à pied.

            </p>

            {/* <Link
              href="#bungalows"
              className="mt-8 inline-block rounded-md bg-[#2F6036] px-6 py-3 text-[#FFFEF6] transition hover:opacity-80"
            >
              Découvrir nos bungalows
            </Link> */}
          </div>

          <div className="relative">
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <Image
                src={photosAccueil[photoActuelle].src}
                alt={photosAccueil[photoActuelle].alt}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            <button
              type="button"
              onClick={photoPrecedente}
              aria-label="Photo précédente"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-4 py-2 text-xl text-[#2F6036] shadow"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={photoSuivante}
              aria-label="Photo suivante"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-4 py-2 text-xl text-[#2F6036] shadow"
            >
              ›
            </button>

            <div className="mt-4 flex justify-center gap-2">
              {photosAccueil.map((photo, index) => (
                <button
                  key={photo.src}
                  type="button"
                  onClick={() => setPhotoActuelle(index)}
                  aria-label={`Afficher la photo ${index + 1}`}
                  aria-current={photoActuelle === index}
                  className={`h-2.5 w-2.5 rounded-full ${
                    photoActuelle === index
                      ? "bg-[#2F6036]"
                      : "bg-[#C6B06B]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 : les trois bungalows */}
      <section id="bungalows" className="bg-[#FFFEF6] px-6 py-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-[#8B3017]">
              Votre séjour
            </p>

            <h2 className="text-3xl font-semibold text-[#2F6036] md:text-4xl">
              Nos bungalows
            </h2>

         <p className="mt-4 w-full leading-7 text-[#222222]">
              Nos bungalows vous offrent un espace privé pour profiter pleinement de votre séjour à Saly. Climatisés et dotés d’un coin kitchenette avec plaques de cuisson, micro-ondes et petit réfrigérateur, ils disposent également du Wi-Fi et d’une télévision connectée. 
            </p>
          </div>

          <div className="mb-22 grid gap-8 md:grid-cols-3">
            {bungalows.map((bungalow) => (
              <article
                key={bungalow.nom}
                className="overflow-hidden rounded-lg bg-white shadow-sm"
              >
                <div className="relative aspect-4/3">
                  <Image
                    src={bungalow.photo}
                    alt={bungalow.nom}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>

                <div className="p-6">
                  <h3 className="mb-3 text-xl font-semibold text-[#2F6036]">
                    {bungalow.nom}
                  </h3>

                  <p className="mb-5 leading-7 text-[#222222]">
                    {bungalow.description}
                  </p>

                  <Link
                    href="/contact"
                    className="font-medium text-[#2F6036] underline underline-offset-4 hover:text-[#8B3017]"
                  >
                    Nous contacter
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}