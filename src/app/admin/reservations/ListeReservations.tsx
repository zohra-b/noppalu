import Link from "next/link";
import {
  CLASSES_STATUT,
  LIBELLES_STATUT,
  formaterDateCourte,
  pluriel,
} from "@/lib/demandes";
import { formaterFcfa } from "@/lib/monnaie";
import type { LigneReservation } from "@/lib/reservations";

// Une réservation ouvre sa fiche ; un blocage sans réservation renvoie au calendrier, où il se modifie
const lien = (l: LigneReservation) =>
  l.demandeId
    ? `/admin/demandes/${l.demandeId}`
    : "/admin/reservations?vue=calendrier";

function Badges({ l }: { l: LigneReservation }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {l.statut ? (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASSES_STATUT[l.statut]}`}
        >
          {LIBELLES_STATUT[l.statut]}
        </span>
      ) : (
        <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          Blocage
        </span>
      )}
      {l.enRetard && (
        <span className="rounded-full bg-red-700 px-2.5 py-0.5 text-xs font-medium text-white">
          Délai dépassé
        </span>
      )}
    </span>
  );
}

// Toute la cellule est cliquable à la souris ; au clavier, un seul arrêt par ligne (la première cellule)
function Cellule({
  l,
  premiere = false,
  className = "",
  children,
}: {
  l: LigneReservation;
  premiere?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <td className="p-0">
      <Link
        href={lien(l)}
        tabIndex={premiere ? undefined : -1}
        className={`block px-3 py-2 ${className}`}
      >
        {children}
      </Link>
    </td>
  );
}

const TH =
  "px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-600";

export default function ListeReservations({
  lignes,
}: {
  lignes: LigneReservation[];
}) {
  if (lignes.length === 0) {
    return (
      <p className="text-gray-600">Aucune réservation dans cette catégorie.</p>
    );
  }

  return (
    <>
      {/* Ordinateur : un tableau */}
      <div className="hidden overflow-hidden rounded-lg bg-[#FFFEF6] shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-[#C6B06B]/40">
            <tr>
              <th scope="col" className={TH}>
                Arrivée
              </th>
              <th scope="col" className={TH}>
                Départ
              </th>
              <th scope="col" className={TH}>
                Nuits
              </th>
              <th scope="col" className={TH}>
                Studio
              </th>
              <th scope="col" className={TH}>
                Client
              </th>
              <th scope="col" className={TH}>
                Origine
              </th>
              <th scope="col" className={TH}>
                Statut
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Montant
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#C6B06B]/30">
            {lignes.map((l) => (
              <tr key={l.cle} className="transition-colors hover:bg-white">
                <Cellule l={l} premiere className="whitespace-nowrap font-medium">
                  {formaterDateCourte(l.arrivee)}
                </Cellule>
                <Cellule l={l} className="whitespace-nowrap">
                  {formaterDateCourte(l.depart)}
                </Cellule>
                <Cellule l={l}>{l.nuits}</Cellule>
                <Cellule l={l}>{l.studio}</Cellule>
                <Cellule l={l}>{l.client ?? "—"}</Cellule>
                <Cellule l={l}>{l.origine}</Cellule>
                <Cellule l={l}>
                  <Badges l={l} />
                </Cellule>
                <Cellule l={l} className="whitespace-nowrap text-right">
                  {l.montant !== null ? formaterFcfa(l.montant) : "—"}
                </Cellule>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Téléphone : deux lignes par réservation */}
      <ul className="space-y-2 md:hidden">
        {lignes.map((l) => (
          <li key={l.cle}>
            <Link
              href={lien(l)}
              className="block rounded-lg bg-[#FFFEF6] p-3 shadow-sm transition-colors hover:bg-white"
            >
              <span className="flex items-start justify-between gap-2">
                <span className="font-medium">
                  {formaterDateCourte(l.arrivee)} →{" "}
                  {formaterDateCourte(l.depart)}
                  <span className="font-normal text-gray-600">
                    {" "}
                    · {pluriel(l.nuits, "nuit")}
                  </span>
                </span>
                <Badges l={l} />
              </span>
              <span className="mt-0.5 block text-sm text-gray-600">
                {[
                  l.studio,
                  l.client,
                  l.origine,
                  l.montant !== null ? formaterFcfa(l.montant) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}