import Link from "next/link";
import { getBungalows } from "@/lib/data";
import {
  delaiDepasse,
  formaterDateCourte,
  getDemandes,
  pluriel,
} from "@/lib/demandes";
import { formaterFcfa } from "@/lib/monnaie";
import { arriveesProches } from "@/lib/rappels";
import { LIBELLES_ORIGINE } from "@/lib/reservations-types";
import { aujourdhuiSenegal, nombreNuits } from "@/lib/sejour";
import { getAdmin } from "@/lib/supabase/session";
import EnteteAdmin from "./EnteteAdmin";
import FormulaireConnexion from "./FormulaireConnexion";

const JOURS = ["Aujourd'hui", "Demain", "Après-demain"];

export default async function AdminPage() {
  const admin = await getAdmin();

  if (!admin) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm rounded-lg bg-[#FFFEF6] p-6 shadow-sm md:p-8">
          <h1 className="mb-6 font-serif text-2xl font-semibold text-green">
            Administration
          </h1>
          <FormulaireConnexion />
        </div>
      </main>
    );
  }

  const [demandes, studios] = await Promise.all([
    getDemandes().catch((e) => {
      console.error("Admin : lecture des demandes impossible", e);
      return null;
    }),
    getBungalows().catch(() => []),
  ]);

  const aujourdhui = aujourdhuiSenegal();
  const noms = new Map(studios.map((s) => [s.slug, s.nom]));

  const nouvelles = demandes?.filter((d) => d.statut === "nouvelle").length ?? 0;
  const aEncaisser =
    demandes?.filter(
      (d) => d.statut === "acceptee" || d.statut === "en_attente_paiement",
    ).length ?? 0;
  const enRetard = demandes?.filter((d) => delaiDepasse(d)).length ?? 0;
  const arrivees = demandes ? arriveesProches(demandes, aujourdhui) : [];

  return (
    <>
      <EnteteAdmin />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <h1 className="mb-6 font-serif text-2xl font-semibold text-green">
          Tableau de bord
        </h1>

        {demandes !== null && (
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
              Arrivées dans les 48 h
            </h2>
            {arrivees.length === 0 ? (
              <p className="text-sm text-gray-600">
                Aucune arrivée dans les 48 prochaines heures.
              </p>
            ) : (
              <ul className="space-y-2">
                {arrivees.map((d) => {
                  const delai = nombreNuits(aujourdhui, d.arrivee);
                  return (
                    <li key={d.id}>
                      <Link
                        href={`/admin/demandes/${d.id}`}
                        className="block rounded-lg bg-[#FFFEF6] p-3 shadow-sm transition-colors hover:bg-white"
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-green">
                            {noms.get(d.studioSlug) ?? d.studioSlug}
                          </span>
                          <span className="shrink-0 rounded-full bg-[#C6B06B]/40 px-2.5 py-0.5 text-xs font-medium">
                            {JOURS[delai] ?? formaterDateCourte(d.arrivee)}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-sm">
                          {formaterDateCourte(d.arrivee)} →{" "}
                          {formaterDateCourte(d.depart)} ·{" "}
                          {pluriel(nombreNuits(d.arrivee, d.depart), "nuit")}
                        </span>
                        <span className="block text-sm text-gray-600">
                          {[
                            d.nom ?? "Client sans nom",
                            d.voyageurs ? pluriel(d.voyageurs, "voyageur") : null,
                            LIBELLES_ORIGINE[d.origine],
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                        {d.statut !== "payee" && (
                          <span className="block text-sm font-medium text-[#8B3017]">
                            À encaisser
                            {d.estimation !== null
                              ? ` : ${formaterFcfa(d.estimation)}`
                              : ""}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        <ul className="space-y-3">
          <li>
            <Link
              href="/admin/reservations"
              className="block rounded-lg bg-[#FFFEF6] p-5 shadow-sm transition-colors hover:bg-white"
            >
              <span className="block font-semibold text-green">Réservations</span>
              <span className="block text-sm text-gray-600">
                {demandes === null
                  ? "Les réservations et les demandes reçues depuis le site."
                  : nouvelles === 0
                    ? "Aucune nouvelle demande."
                    : `${nouvelles} ${nouvelles > 1 ? "nouvelles demandes" : "nouvelle demande"} à traiter`}
              </span>
              {aEncaisser > 0 && (
                <span className="block text-sm text-gray-600">
                  {aEncaisser} à encaisser
                </span>
              )}
              {enRetard > 0 && (
                <span className="mt-1 block text-sm font-medium text-red-700">
                  {enRetard}{" "}
                  {enRetard > 1
                    ? "délais de paiement dépassés"
                    : "délai de paiement dépassé"}
                </span>
              )}
            </Link>
          </li>
          <li>
            <Link
              href="/admin/reservations?vue=calendrier"
              className="block rounded-lg bg-[#FFFEF6] p-5 shadow-sm transition-colors hover:bg-white"
            >
              <span className="block font-semibold text-green">Calendrier</span>
              <span className="block text-sm text-gray-600">
                Les nuits occupées de chaque studio.
              </span>
            </Link>
          </li>
        </ul>
      </main>
    </>
  );
}