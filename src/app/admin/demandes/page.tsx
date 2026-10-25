import type { Metadata } from "next";
import Link from "next/link";
import { getBungalows } from "@/lib/data";
import {
  CLASSES_STATUT,
  LIBELLES_STATUT,
  delaiDepasse,
  formaterDate,
  formaterDateHeure,
  getDemandes,
  pluriel,
  type Demande,
  type StatutDemande,
} from "@/lib/demandes";
import { nombreNuits } from "@/lib/sejour";
import { requireAdmin } from "@/lib/supabase/session";
import EnteteAdmin from "../EnteteAdmin";

export const metadata: Metadata = { title: "Demandes" };

type Filtre = {
  cle: string;
  libelle: string;
  statuts: StatutDemande[] | null; // null = toutes
};

const FILTRES: Filtre[] = [
  { cle: "a-traiter", libelle: "À traiter", statuts: ["nouvelle"] },
  {
    cle: "acceptees",
    libelle: "Acceptées",
    statuts: ["acceptee", "en_attente_paiement"],
  },
  {
    cle: "terminees",
    libelle: "Terminées",
    statuts: ["payee", "refusee", "expiree"],
  },
  { cle: "toutes", libelle: "Toutes", statuts: null },
];

function filtrer(demandes: Demande[], filtre: Filtre): Demande[] {
  const statuts = filtre.statuts;
  return statuts ? demandes.filter((d) => statuts.includes(d.statut)) : demandes;
}

export default async function DemandesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  await requireAdmin();

  const { statut } = await searchParams;
  const filtre = FILTRES.find((f) => f.cle === statut) ?? FILTRES[0];

  let demandes: Demande[] | null = null;
  try {
    demandes = await getDemandes();
  } catch (e) {
    console.error("Admin : lecture des demandes impossible", e);
  }

  const studios = await getBungalows().catch(() => []);
  const noms = new Map(studios.map((s) => [s.slug, s.nom]));

  const affichees = demandes ? filtrer(demandes, filtre) : [];

  return (
    <>
      <EnteteAdmin />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Link
          href="/admin"
          className="text-sm text-green underline underline-offset-4"
        >
          ← Tableau de bord
        </Link>
        <h1 className="mb-4 mt-4 font-serif text-2xl font-semibold text-green">
          Demandes de réservation
        </h1>

        {demandes === null ? (
          <p role="alert" className="text-red-700">
            Impossible de charger les demandes. Rechargez la page.
          </p>
        ) : (
          <>
            <nav aria-label="Filtrer les demandes" className="mb-5 flex flex-wrap gap-2">
              {FILTRES.map((f) => {
                const actif = f.cle === filtre.cle;
                return (
                  <Link
                    key={f.cle}
                    href={`/admin/demandes?statut=${f.cle}`}
                    aria-current={actif ? "page" : undefined}
                    className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                      actif
                        ? "border-[#2F6036] bg-[#2F6036] text-white"
                        : "border-[#C6B06B] text-[#2F6036] hover:bg-white"
                    }`}
                  >
                    {f.libelle} ({filtrer(demandes, f).length})
                  </Link>
                );
              })}
            </nav>

            {affichees.length === 0 ? (
              <p className="text-gray-600">Aucune demande dans cette catégorie.</p>
            ) : (
              <ul className="space-y-3">
                {affichees.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/admin/demandes/${d.id}`}
                      className="block rounded-lg bg-[#FFFEF6] p-4 shadow-sm transition-colors hover:bg-white"
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-green">
                          {noms.get(d.studioSlug) ?? d.studioSlug}
                        </span>
                         <span className="flex shrink-0 flex-col items-end gap-1">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASSES_STATUT[d.statut]}`}
                          >
                            {LIBELLES_STATUT[d.statut]}
                          </span>
                          {delaiDepasse(d) && (
                            <span className="rounded-full bg-red-700 px-2.5 py-0.5 text-xs font-medium text-white">
                              Délai dépassé
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm">
                        {formaterDate(d.arrivee)} → {formaterDate(d.depart)} ·{" "}
                        {pluriel(nombreNuits(d.arrivee, d.depart), "nuit")}
                        {d.voyageurs !== null &&
                          ` · ${pluriel(d.voyageurs, "voyageur")}`}
                      </span>
                      <span className="mt-1 block text-sm text-gray-600">
                        {d.nom ?? "Client sans nom"} · reçue le{" "}
                        {formaterDateHeure(d.creeeLe)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </>
  );
}