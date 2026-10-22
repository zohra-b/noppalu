"use client";

import { useActionState } from "react";
import { connexion, type EtatConnexion } from "./actions";

const CHAMP =
  "w-full rounded-md border border-[#C6B06B] bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-green";

export default function FormulaireConnexion() {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(
    connexion,
    null,
  );

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="identifiant" className="mb-1 block text-sm font-medium">
          Identifiant
        </label>
        <input
          id="identifiant"
          name="identifiant"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          className={CHAMP}
        />
      </div>

      <div>
        <label htmlFor="motdepasse" className="mb-1 block text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="motdepasse"
          name="motdepasse"
          type="password"
          autoComplete="current-password"
          required
          className={CHAMP}
        />
      </div>

      {etat?.erreur && (
        <p role="alert" className="text-sm text-red-700">
          {etat.erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={enCours}
        className="w-full rounded-md bg-green px-5 py-3 font-medium text-linen transition-colors hover:bg-[#244D2B] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enCours ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}