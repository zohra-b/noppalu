
"use client";

import Image from "next/image";
import Link from "next/link";
import Gallery from "@/components/Gallery";
import { bungalows } from "@/lib/bungalows";

const photosAccueil = [
  { src: "/images/jardin1.png", alt: "Le jardin de Casa Noppalu" },
  { src: "/images/jardin2.jpg", alt: "Une adorable salamandre" },
  { src: "/images/jardin3.jpg", alt: "La terrasse pour l'apéro" },
  { src: "/images/jardin4.jpg", alt: "Un escargot nous rend visite" },
  { src: "/images/piscine1.jpg", alt: "La piscine de Casa Noppalu" },
  { src: "/images/plage.jpg", alt: "La plage à proximité" },
];

export default function Home() {
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
          </div>

          <Gallery photos = {photosAccueil}/>
        
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
    key={bungalow.slug}
    className="overflow-hidden rounded-lg bg-white shadow-sm"
  >
    <div className="relative aspect-4/3">
      <Image
        src={bungalow.photos[0].src}
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
        {bungalow.resume}
      </p>

      <Link
        href={bungalow.publie ? `/bungalows/${bungalow.slug}` : "/bungalows"}
        className="font-medium text-[#2F6036] underline underline-offset-4 hover:text-[#8B3017]"
      >
        {bungalow.publie ? "Découvrir ce bungalow" : "Voir les bungalows"}
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