import Link from "next/link";
import { deconnexion } from "./actions";

export default function EnteteAdmin() {
  return (
    <header className="border-b border-[#C6B06B]/60 bg-[#FFFEF6]">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/admin"
          className="font-serif text-lg font-semibold text-green"
        >
          Administration
        </Link>
        <form action={deconnexion}>
          <button
            type="submit"
            className="rounded-md border border-green px-3 py-1.5 text-sm font-medium text-green transition-colors hover:bg-green hover:text-linen"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </header>
  );
}