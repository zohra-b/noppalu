import type { Metadata } from "next";
import Link from "next/link";
import { getBlocages } from "@/lib/blocages";
import { getBungalows } from "@/lib/data";
import { aujourdhuiSenegal } from "@/lib/sejour";
import { requireAdmin } from "@/lib/supabase/session";
import EnteteAdmin from "../EnteteAdmin";
import CalendrierAdmin from "./CalendrierAdmin";

export const metadata: Metadata = { title: "Calendrier" };

export default async function CalendrierPage() {
  await requireAdmin();

  const [studios, blocages] = await Promise.all([
    getBungalows().catch((e) => {
      console.error("Admin : lecture des studios impossible", e);
      return null;
    }),
    getBlocages().catch((e) => {
      console.error("Admin : lecture des blocages impossible", e);
      return null;
    }),
  ]);

  return (
    <>
      <EnteteAdmin />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Link
          href="/admin"
          className="text-sm text-green underline underline-offset-4"
        >
          ← Tableau de bord
        </Link>
        <h1 className="mb-6 mt-4 font-serif text-2xl font-semibold text-green">
          Calendrier
        </h1>

        {studios === null || blocages === null ? (
          <p role="alert" className="text-red-700">
            Impossible de charger le calendrier. Rechargez la page.
          </p>
        ) : (
          <CalendrierAdmin
            studios={studios.map(({ slug, nom }) => ({ slug, nom }))}
            blocages={blocages}
            aujourdhui={aujourdhuiSenegal()}
          />
        )}
      </main>
    </>
  );
}