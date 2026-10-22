import Link from "next/link";
import { getAdmin } from "@/lib/supabase/session";
import EnteteAdmin from "./EnteteAdmin";
import FormulaireConnexion from "./FormulaireConnexion";

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

  return (
    <>
      <EnteteAdmin />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <h1 className="mb-6 font-serif text-2xl font-semibold text-green">
          Tableau de bord
        </h1>
        <ul className="space-y-3">
          <li>
            <Link
              href="/admin/demandes"
              className="block rounded-lg bg-[#FFFEF6] p-5 shadow-sm transition-colors hover:bg-white"
            >
              <span className="block font-semibold text-green">
                Demandes de réservation
              </span>
              <span className="block text-sm text-gray-600">
                Les demandes reçues depuis le site.
              </span>
            </Link>
          </li>
        </ul>
      </main>
    </>
  );
}