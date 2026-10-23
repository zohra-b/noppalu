"use client";

import { useState } from "react";

export default function CopierMessage({ texte }: { texte: string }) {
  const [etat, setEtat] = useState<"repos" | "copie" | "erreur">("repos");

  async function copier() {
    try {
      await navigator.clipboard.writeText(texte);
      setEtat("copie");
      setTimeout(() => setEtat("repos"), 2500);
    } catch {
      setEtat("erreur");
    }
  }

  return (
    <button
      type="button"
      onClick={copier}
      className="flex-1 rounded-md border border-green px-4 py-2 text-center text-sm font-medium text-green transition-colors hover:bg-green hover:text-linen"
    >
      {etat === "copie"
        ? "Message copié ✓"
        : etat === "erreur"
          ? "Copie impossible"
          : "Copier le message"}
    </button>
  );
}