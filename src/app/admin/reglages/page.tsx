import type { Metadata } from "next";
import Link from "next/link";
import { routing } from "@/i18n/routing";
import { getBungalows } from "@/lib/data";
import { getReglagesAdmin } from "@/lib/reglages-admin";
import { requireAdmin } from "@/lib/supabase/session";
import EnteteAdmin from "../EnteteAdmin";
import FormulaireConditions from "./FormulaireConditions";
import FormulaireStudio from "./FormulaireStudio";
import FormulaireTarifs from "./FormulaireTarifs";
import GestionServices from "./GestionServices";

export const metadata: Metadata = { title: "Réglages" };

const SECTIONS = [
  ["studios", "Studios"],
  ["tarifs", "Tarifs"],
  ["services", "Services"],
  ["conditions", "Conditions"],
];

const CARTE = "rounded-lg bg-[#FFFEF6] p-4 shadow-sm";

export default async function ReglagesPage() {
  await requireAdmin();

  const [studios, reglages] = await Promise.all([
    getBungalows().catch((e) => {
      console.error("Admin : lecture des studios impossible", e);
      return null;
    }),
    getReglagesAdmin().catch((e) => {
      console.error("Admin : lecture des réglages impossible", e);
      return null;
    }),
  ]);

  const langues = [...routing.locales];
  const ordreSuivant = reglages
    ? Math.max(0, ...reglages.services.map((s) => s.ordre)) + 1
    : 1;

  const erreurReglages = (
    <p role="alert" className="text-red-700">
      Impossible de charger cette section. Rechargez la page.
    </p>
  );

  return (
    <>
      <EnteteAdmin />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">
        <Link
          href="/admin"
          className="text-sm text-green underline underline-offset-4"
        >
          ← Tableau de bord
        </Link>
        <h1 className="mb-3 mt-3 font-serif text-2xl font-semibold text-green">
          Réglages
        </h1>

        <nav aria-label="Sections" className="mb-6 flex flex-wrap gap-2 text-sm">
          {SECTIONS.map(([id, libelle]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-full border border-[#C6B06B] px-3 py-1 text-[#2F6036] transition-colors hover:bg-white"
            >
              {libelle}
            </a>
          ))}
        </nav>

        <section id="studios" className="mb-8 scroll-mt-4">
          <h2 className="mb-1 font-serif text-xl font-semibold text-green">
            Studios
          </h2>
          <p className="mb-3 text-sm text-gray-600">
            L&apos;adresse d&apos;un studio (par exemple /bungalows/manguier)
            et ses photos ne se modifient pas ici.
          </p>

          {studios === null ? (
            <p role="alert" className="text-red-700">
              Impossible de charger les studios. Rechargez la page.
            </p>
          ) : studios.length === 0 ? (
            <p className="text-gray-600">Aucun studio n&apos;est enregistré.</p>
          ) : (
            <div className="space-y-3">
              {studios.map((s) => (
                <details
                  key={s.slug}
                  className="rounded-lg bg-[#FFFEF6] shadow-sm"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 p-4">
                    <span className="font-semibold text-green">{s.nom}</span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        s.publie
                          ? "bg-[#2F6036]/15 text-[#2F6036]"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {s.publie ? "Visible" : "Masqué"}
                    </span>
                  </summary>
                  <div className="border-t border-[#C6B06B]/40 p-4">
                    <FormulaireStudio
                      studio={{
                        slug: s.slug,
                        nom: s.nom,
                        publie: s.publie,
                        capacite: s.capacite,
                        litCm: s.litCm,
                        equipements: s.equipements,
                        resume: s.resume,
                        description: s.description,
                      }}
                      langues={langues}
                    />
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>

        <section id="tarifs" className="mb-8 scroll-mt-4">
          <h2 className="mb-3 font-serif text-xl font-semibold text-green">
            Tarifs
          </h2>
          {reglages === null ? (
            erreurReglages
          ) : (
            <div className={CARTE}>
              <FormulaireTarifs
                tarifs={reglages.tarifs}
                afficherPrix={reglages.afficherPrix}
                annonce={reglages.annonce}
                langues={langues}
              />
            </div>
          )}
        </section>

        <section id="services" className="mb-8 scroll-mt-4">
          <h2 className="mb-1 font-serif text-xl font-semibold text-green">
            Services
          </h2>
          <p className="mb-3 text-sm text-gray-600">
            Transfert, petit-déjeuner… Ils s&apos;affichent sous les tarifs.
            Sans prix, la ligne indique « nous consulter ». Les services ne
            s&apos;ajoutent pas aux montants estimés : corrigez le montant d&apos;une
            réservation à la main si besoin.
          </p>
          {reglages === null ? (
            erreurReglages
          ) : (
            <GestionServices
              services={reglages.services}
              langues={langues}
              ordreSuivant={ordreSuivant}
            />
          )}
        </section>

        <section id="conditions" className="mb-8 scroll-mt-4">
          <h2 className="mb-3 font-serif text-xl font-semibold text-green">
            Conditions
          </h2>
          {reglages === null ? (
            erreurReglages
          ) : (
            <div className={CARTE}>
              <FormulaireConditions
                conditions={reglages.conditions}
                langues={langues}
              />
            </div>
          )}
        </section>
      </main>
    </>
  );
}