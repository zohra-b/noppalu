// Compare les fichiers de messages avec la langue de référence (fr.json).
// Usage : POUR LANCER LE SCRIPT :  node scripts/verifier-messages.mjs [langue ...]   (par défaut : en es)
import { readFileSync } from "node:fs";

const REFERENCE = "fr";
const langues = process.argv.slice(2);
if (langues.length === 0) langues.push("en", "es");

function lire(langue) {
  const chemin = new URL(`../src/messages/${langue}.json`, import.meta.url);
  return JSON.parse(readFileSync(chemin, "utf8"));
}

// { A: { b: "x" } } devient { "A.b": "x" }
function aplatir(objet, prefixe = "", sortie = {}) {
  for (const [cle, valeur] of Object.entries(objet)) {
    const chemin = prefixe ? `${prefixe}.${cle}` : cle;
    if (valeur !== null && typeof valeur === "object") {
      aplatir(valeur, chemin, sortie);
    } else {
      sortie[chemin] = String(valeur);
    }
  }
  return sortie;
}

// Noms des variables d'un message : {nom}, {n, plural, ...}
function variables(texte) {
  const noms = [
    ...texte.matchAll(/\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*[,}]/g),
  ].map((m) => m[1]);
  return [...new Set(noms)].sort().join(", ");
}

let erreurs = 0;
const reference = aplatir(lire(REFERENCE));

for (const langue of langues) {
  let cible;
  try {
    cible = aplatir(lire(langue));
  } catch (e) {
    console.log(`\n✗ ${langue}.json : fichier illisible (${e.message})`);
    erreurs++;
    continue;
  }

  const manquantes = Object.keys(reference).filter((c) => !(c in cible));
  const enTrop = Object.keys(cible).filter((c) => !(c in reference));
  const vides = Object.keys(cible).filter((c) => cible[c].trim() === "");
  const variablesDifferentes = Object.keys(reference).filter(
    (c) => c in cible && variables(reference[c]) !== variables(cible[c]),
  );

  const problemes =
    manquantes.length + enTrop.length + vides.length + variablesDifferentes.length;

  if (problemes === 0) {
    console.log(
      `✓ ${langue}.json : ${Object.keys(cible).length} textes, mêmes clés et mêmes variables que ${REFERENCE}.json`,
    );
    continue;
  }

  erreurs += problemes;
  console.log(`\n✗ ${langue}.json : ${problemes} problème(s)`);
  const afficher = (titre, liste) => {
    if (liste.length === 0) return;
    console.log(`  ${titre} :`);
    liste.forEach((c) => console.log(`    - ${c}`));
  };
  afficher("Clés manquantes", manquantes);
  afficher("Clés en trop", enTrop);
  afficher("Textes vides", vides);
  afficher(
    "Variables différentes de fr.json",
    variablesDifferentes.map(
      (c) =>
        `${c} (fr : ${variables(reference[c]) || "aucune"} / ${langue} : ${variables(cible[c]) || "aucune"})`,
    ),
  );
}

process.exit(erreurs > 0 ? 1 : 0);
