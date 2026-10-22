import { getAdmin } from "@/lib/supabase/session";
import FormulaireConnexion from "./FormulaireConnexion";
import { deconnexion } from "./actions";

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
    <main className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm rounded-lg bg-[#FFFEF6] p-6 shadow-sm md:p-8">
        <h1 className="mb-4 font-serif text-2xl font-semibold text-green">
          Administration
        </h1>
        <p className="mb-6 leading-7">Vous êtes connecté.</p>
        <form action={deconnexion}>
          <button
            type="submit"
            className="w-full rounded-md border border-green px-5 py-3 font-medium text-green transition-colors hover:bg-green hover:text-linen"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </main>
  );
}