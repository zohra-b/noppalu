"use client";

import { useState } from "react";
import Image from "next/image";

type Photo = { src: string; alt: string };

type Props = {
  photos: Photo[];
  priority?: boolean;
  sizes?: string;
};

export default function Gallery({
  photos,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: Props) {
  const [actuelle, setActuelle] = useState(0);

  if (photos.length === 0) return null;

  function precedente() {
    setActuelle((actuelle - 1 + photos.length) % photos.length);
  }

  function suivante() {
    setActuelle((actuelle + 1) % photos.length);
  }

  const plusieurs = photos.length > 1;

  return (
    <div className="relative">
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <Image
          src={photos[actuelle].src}
          alt={photos[actuelle].alt}
          fill
          priority={priority}
          className="object-cover"
          sizes={sizes}
        />
      </div>

      {plusieurs && (
        <>
          <button
            type="button"
            onClick={precedente}
            aria-label="Photo précédente"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-4 py-2 text-xl text-[#2F6036] shadow"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={suivante}
            aria-label="Photo suivante"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-4 py-2 text-xl text-[#2F6036] shadow"
          >
            ›
          </button>

          <div className="mt-4 flex justify-center gap-2">
            {photos.map((photo, index) => (
              <button
                key={photo.src}
                type="button"
                onClick={() => setActuelle(index)}
                aria-label={`Afficher la photo ${index + 1}`}
                aria-current={actuelle === index}
                className={`h-2.5 w-2.5 rounded-full ${
                  actuelle === index ? "bg-[#2F6036]" : "bg-[#C6B06B]"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}