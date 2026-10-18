"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="flex min-h-screen items-center justify-center bg-linen px-6 text-[#222222]">
        <main className="max-w-xl">
          <h1 className="mb-4 font-serif text-3xl font-semibold text-green">
            Casa Noppalu est momentanément indisponible
          </h1>
          <p className="mb-6 leading-7">
            Le site rencontre un problème technique. Vous pouvez réessayer
            dans un instant, ou nous joindre directement.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-md bg-green px-5 py-2 text-white"
            >
              Réessayer
            </button>
            <a
              href="mailto:contact@casanoppalu.com"
              className="font-medium text-green underline underline-offset-4"
            >
              contact@casanoppalu.com
            </a>
            <a
              href="https://wa.me/34637251773"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-green underline underline-offset-4"
            >
              WhatsApp
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}