import type { ReactNode } from "react";

// Dans une condition, le texte entouré de ** s'affiche en gras (ex. **Capacité :** 2 personnes)
export function avecGras(texte: string): ReactNode[] {
  return texte
    .split(/\*\*(.+?)\*\*/g)
    .map((morceau, i) =>
      i % 2 === 1 ? <strong key={i}>{morceau}</strong> : morceau,
    );
}

/** Vrai si les ** sont bien fermés (sinon des astérisques resteraient visibles sur le site). */
export function grasEquilibre(texte: string): boolean {
  return (texte.match(/\*\*/g) ?? []).length % 2 === 0;
}