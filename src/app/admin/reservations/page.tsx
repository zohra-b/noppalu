import type { Metadata } from "next";
import Link from "next/link";
import { getBlocages } from "@/lib/blocages";
import { getBungalows, getReglages } from "@/lib/data";
import { getDemandes } from "@/lib/demandes";
import {
  FILTRES,
  construireLignes,
  correspond,
  filtreParDefaut,
  trier,
  type CleFiltre,
} from "@/lib/reservations";
import { aujourdhuiSenegal } from "@/lib/sejour";
import { requireAdmin } from "@/lib/supabase/session";
import CalendrierAdmin from "../calendrier/CalendrierAdmin";
import EnteteAdmin from "../EnteteAdmin";
import ListeReservations from "./ListeReservations";
import Orphelins from "./Orphelins";
import NouvelleReservation from "./NouvelleReservation";
import { estOrphelin } from "@/lib/blocages-types";

export const metadata: Metadata = { title: "Réservations" };

const ONGLET =
  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors";

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; filtre?: string }>;
}) {
  await requireAdmin();

  const { vue, filtre } = await searchParams;
  const calendrier = vue === "calendrier";

  const [studios, demandes, blocages, reglages] = await Promise.all([
    getBungalows().catch((e) => {
      console.error("Admin : lecture des studios impossible", e);
      return null;
    }),
    getDemandes().catch((e) => {
      console.error("Admin : lecture des demandes impossible", e);
      return null;
    }),
    getBlocages().catch((e) => {
      console.error("Admin : lecture des blocages impossible", e);
      return null;
    }),
    getReglages().catch(() => null),
  ]);

  const aujourdhui = aujourdhuiSenegal();

  let contenu: React.ReactNode;

  if (!studios || !demandes || !blocages) {
    contenu = (
      <p role="alert" className="text-red-700">
        Impossible de charger les réservations. Rechargez la page.
      </p>
    );
  } else {
    const noms = new Map(studios.map((s) => [s.slug, s.nom]));
    const lignes = construireLignes(demandes, blocages, noms);
    const studiosForm = studios.map(({ slug, nom }) => ({ slug, nom }));

    const cle: CleFiltre = FILTRES.some((f) => f.cle === filtre)
      ? (filtre as CleFiltre)
      : filtreParDefaut(lignes, aujourdhui);
    const affichees = trier(
      lignes.filter((l) => correspond(l, cle, aujourdhui)),
      cle,
    );

    contenu = (
      <>
        <Orphelins
          orphelins={blocages.filter(estOrphelin).map((b) => ({
            id: b.id,
            studio: noms.get(b.studioSlug) ?? b.studioSlug,
            debut: b.debut,
            fin: b.fin,
            nom: b.nom,
          }))}
        />
        <NouvelleReservation
          studios={studiosForm}
          tarifs={reglages ? reglages.tarifs : null}
          aujourdhui={aujourdhui}
        />

        {calendrier ? (
          <CalendrierAdmin
            studios={studiosForm}
            blocages={blocages}
            aujourdhui={aujourdhui}
          />
        ) : (
          <>
            <nav
              aria-label="Filtrer les réservations"
              className="mb-4 flex flex-wrap gap-2"
            >
              {FILTRES.map((f) => {
                const actif = f.cle === cle;
                const nombre = lignes.filter((l) =>
                  correspond(l, f.cle, aujourdhui),
                ).length;
                return (
                  <Link
                    key={f.cle}
                    href={`/admin/reservations?filtre=${f.cle}`}
                    aria-current={actif ? "page" : undefined}
                    className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                      actif
                        ? "border-[#2F6036] bg-[#2F6036] text-white"
                        : "border-[#C6B06B] text-[#2F6036] hover:bg-white"
                    }`}
                  >
                    {f.libelle} ({nombre})
                  </Link>
                );
              })}
            </nav>
            <ListeReservations lignes={affichees} />
          </>
        )}
      </>
    );
  }

  return (
    <>
      <EnteteAdmin />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5">
        <Link
          href="/admin"
          className="text-sm text-green underline underline-offset-4"
        >
          ← Tableau de bord
        </Link>

        <div className="mb-4 mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-2xl font-semibold text-green">
            Réservations
          </h1>
          <nav
            aria-label="Affichage"
            className="flex gap-1 rounded-lg bg-[#FFFEF6] p-1 shadow-sm"
          >
            <Link
              href="/admin/reservations"
              aria-current={calendrier ? undefined : "page"}
              className={`${ONGLET} ${
                calendrier
                  ? "text-green hover:bg-white"
                  : "bg-green text-linen"
              }`}
            >
              Liste
            </Link>
            <Link
              href="/admin/reservations?vue=calendrier"
              aria-current={calendrier ? "page" : undefined}
              className={`${ONGLET} ${
                calendrier
                  ? "bg-green text-linen"
                  : "text-green hover:bg-white"
              }`}
            >
              Calendrier
            </Link>
          </nav>
        </div>

        {contenu}
      </main>
    </>
  );
}