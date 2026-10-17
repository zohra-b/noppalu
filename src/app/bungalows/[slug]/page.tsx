import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bungalows, getBungalow, infosCommunes } from "@/lib/bungalows";
import BungalowInfos from "@/components/BungalowInfos";
import Gallery from "@/components/Gallery";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return bungalows.filter((b) => b.publie).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bungalow = getBungalow(slug);
  if (!bungalow || !bungalow.publie) return {};
  return {
    title: `Bungalow ${bungalow.nom} – Casa Noppalu, Saly`,
    description: bungalow.resume,
  };
}

export default async function BungalowPage({ params }: Props) {
  const { slug } = await params;
  const bungalow = getBungalow(slug);
  if (!bungalow || !bungalow.publie) notFound();

  return (
    <main className="flex-1 px-6 py-10 text-[#222222] md:px-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/bungalows"
          className="text-sm text-[#2F6036] underline underline-offset-4"
        >
          ← Présentation générale
        </Link>

        <header className="mb-8 mt-4">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#8B3017]">
            Casa Noppalu
          </p>
          <h1 className="text-3xl font-semibold text-[#2F6036] md:text-4xl">
            {bungalow.nom}
          </h1>
          <p className="mt-3 text-lg">{bungalow.resume}</p>
        </header>

        {bungalow.photos.length > 0 && (
          <div className="mb-10 max-w-full">
            <Gallery photos={bungalow.photos} />
          </div>
        )}

        {bungalow.description && (
          <section className="mb-10">
            <h2 className="mb-3 font-serif text-2xl text-[#2F6036]">
              Description
            </h2>
            <p className="max-w-3xl leading-7">{bungalow.description}</p>
          </section>
        )}

        <BungalowInfos
            equipements={[
                { icone: "lit", libelle: `Lit en ${bungalow.lit}` },
                ...infosCommunes.equipements,
            ]}
            conditions={infosCommunes.conditions}
            />

        {/* <section className="mt-10 rounded-lg bg-[#FFFEF6] p-6 shadow-sm">
          <h2 className="mb-3 font-serif text-2xl text-[#2F6036]">
            Disponibilités
          </h2>
          
          <p>Le calendrier de disponibilité sera bientôt affiché ici.</p>
        </section> */}
      </div>
    </main>
  );
}