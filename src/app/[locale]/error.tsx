"use client";

import { useEffect } from "react";
import {Link} from "@/i18n/navigation";

export default function Error({
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
    <main className="flex-1 px-6 py-16 md:px-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-3xl font-semibold text-green">
          Cette page n’a pas pu s’afficher
        </h1>
        <div className="flex flex-wrap items-center gap-6">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md bg-green px-5 py-2 text-white hover:bg-sand"
          >
            Réessayer
          </button>
          <Link
            href="/contact"
            className="font-medium text-green underline underline-offset-4 hover:text-sand"
          >
            Nous contacter
          </Link>
        </div>
      </div>
    </main>
  );
}