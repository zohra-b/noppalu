import Link from "next/link";
import { delaiDepasse, getDemandes } from "@/lib/demandes";
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

  const demandes = await getDemandes().catch((e) => {
    console.error("Admin : lecture des demandes impossible", e);
    return null;
  });
  const nouvelles = demandes?.filter((d) => d.statut === "nouvelle").length ?? 0;
  const enRetard = demandes?.filter((d) => delaiDepasse(d)).length ?? 0;

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
                {demandes === null
                  ? "Les demandes reçues depuis le site."
                  : nouvelles === 0
                    ? "Aucune nouvelle demande."
                    : `${nouvelles} ${nouvelles > 1 ? "nouvelles demandes" : "nouvelle demande"} à traiter`}
              </span>
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
        </ul>
      </main>
    </>
  );
}