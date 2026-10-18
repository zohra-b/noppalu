import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 px-6 py-16 md:px-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-3xl font-semibold text-green">
          Cette page n’existe pas
        </h1>
        <p className="mb-6 leading-7 text-[#222222]">
          Le lien est peut-être ancien ou mal saisi. Voici où aller :
        </p>
        <div className="flex flex-wrap gap-6">
          <Link href="/" className="font-medium text-green underline underline-offset-4 hover:text-sand">
            Accueil
          </Link>
          <Link href="/bungalows" className="font-medium text-green underline underline-offset-4 hover:text-sand">
            Les bungalows
          </Link>
          <Link href="/contact" className="font-medium text-green underline underline-offset-4 hover:text-sand">
            Contact
          </Link>
        </div>
      </div>
    </main>
  );
}