"use client";

import { useActionState } from "react";
import { libererOrphelin, type EtatBlocage } from "../calendrier/actions";

type Orphelin = {
  id: string;
  studio: string;
  debut: string; // AAAA-MM-JJ
  fin: string; // AAAA-MM-JJ
  nom: string | null;
};

const formatDate = new Intl.DateTimeFormat("fr", {
  dateStyle: "medium",
  timeZone: "UTC",
});
const date = (cle: string) => {
  const [a, m, j] = cle.split("-").map(Number);
  return formatDate.format(new Date(Date.UTC(a, m - 1, j)));
};

export default function Orphelins({ orphelins }: { orphelins: Orphelin[] }) {
  if (orphelins.length === 0) return null;

  return (
    <section className="mb-5 rounded-lg border border-[#8B3017] bg-white p-3 text-sm md:p-4">
      <h2 className="font-semibold text-[#8B3017]">
        Dates bloquées sans réservation
      </h2>
      <p className="mb-2 text-gray-600">
        Ces blocages viennent d&apos;une demande du site qui a été supprimée
        dans la base. Libérez-les si les dates sont de nouveau disponibles.
      </p>
      <ul className="space-y-2">
        {orphelins.map((o) => (
          <LigneOrphelin key={o.id} o={o} />
        ))}
      </ul>
    </section>
  );
}

function LigneOrphelin({ o }: { o: Orphelin }) {
  const [etat, action, enCours] = useActionState<EtatBlocage, FormData>(
    libererOrphelin,
    null,
  );

  return (
    <li>
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={o.id} />
        <span className="flex-1">
          <span className="font-medium">{o.studio}</span> : du {date(o.debut)}{" "}
          au {date(o.fin)}
          {o.nom ? ` (${o.nom})` : ""}
        </span>
        <button
          type="submit"
          disabled={enCours}
          onClick={(e) => {
            if (
              !window.confirm(
                "Libérer ces dates ? Le studio redeviendra disponible sur le site.",
              )
            ) {
              e.preventDefault();
            }
          }}
          className="rounded-md border border-red-700 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-700 hover:text-white disabled:opacity-50"
        >
          {enCours ? "Libération…" : "Libérer"}
        </button>
      </form>
      {etat?.erreur && (
        <p role="alert" className="mt-1 text-red-700">
          {etat.erreur}
        </p>
      )}
    </li>
  );
}