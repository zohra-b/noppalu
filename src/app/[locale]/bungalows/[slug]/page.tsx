import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { bungalows, getBungalow, infosCommunes } from "@/lib/bungalows";
import BungalowInfos from "@/components/BungalowInfos";
import Gallery from "@/components/Gallery";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return bungalows.filter((b) => b.publie).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const bungalow = getBungalow(slug);
  if (!bungalow || !bungalow.publie) return {};
  const t = await getTranslations({ locale, namespace: "Bungalows" });
  return {
    title: t("metaTitreBungalow", { nom: bungalow.nom }),
    description: t(`items.${slug}.resume`),
  };
}

export default async function BungalowPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const bungalow = getBungalow(slug);
  if (!bungalow || !bungalow.publie) notFound();

  const t = await getTranslations("Bungalows");

  const photos = bungalow.photos.map((src) => ({
    src,
    alt: t("photoAlt", { nom: bungalow.nom }),
  }));

  // Description facultative : ajoute la clé "items.<slug>.description" dans fr.json
  const cleDescription = `items.${slug}.description`;
  const description = t.has(cleDescription) ? t(cleDescription) : null;

  return (
    <main className="flex-1 px-6 py-10 text-[#222222] md:px-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/bungalows"
          className="text-sm text-[#2F6036] underline underline-offset-4"
        >
          {t("retour")}
        </Link>

        <header className="mb-8 mt-4">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#8B3017]">
            Casa Noppalu
          </p>
          <h1 className="text-3xl font-semibold text-[#2F6036] md:text-4xl">
            {bungalow.nom}
          </h1>
          <p className="mt-3 text-lg">{t(`items.${slug}.resume`)}</p>
        </header>

        {photos.length > 0 && (
          <div className="mb-10 max-w-full">
            <Gallery photos={photos} />
          </div>
        )}

        {description && (
          <section className="mb-10">
            <h2 className="mb-3 font-serif text-2xl text-[#2F6036]">
              {t("descriptionTitre")}
            </h2>
            <p className="max-w-3xl leading-7">{description}</p>
          </section>
        )}

        <BungalowInfos
          equipements={[
            { icone: "lit", valeur: bungalow.lit },
            ...infosCommunes.equipements,
          ]}
          tarifs={infosCommunes.tarifs}
          transfertAeroport={infosCommunes.transfertAeroport}
          conditions={infosCommunes.conditions}
        />
      </div>
    </main>
  );
}