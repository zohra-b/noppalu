import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/session";
import EnteteAdmin from "../EnteteAdmin";

export const metadata: Metadata = { title: "Demandes" };

export default async function DemandesPage() {
  await requireAdmin();

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
        <p className="leading-7">Cette page affichera bientôt les demandes reçues.</p>
      </main>
    </>
  );
}