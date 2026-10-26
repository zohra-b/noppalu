import type { Metadata } from "next";
import Link from "next/link";
import { routing } from "@/i18n/routing";
import { getBungalows } from "@/lib/data";
import { requireAdmin } from "@/lib/supabase/session";
import EnteteAdmin from "../EnteteAdmin";
import FormulaireStudio from "./FormulaireStudio";

export const metadata: Metadata = { title: "Réglages" };

export default async function ReglagesPage() {
  await requireAdmin();

  const studios = await getBungalows().catch((e) => {
    console.error("Admin : lecture des studios impossible", e);
    return null;
  });

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
        <h1 className="mb-4 mt-3 font-serif text-2xl font-semibold text-green">
          Réglages
        </h1>

        <section>
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
                      langues={[...routing.locales]}
                    />
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}