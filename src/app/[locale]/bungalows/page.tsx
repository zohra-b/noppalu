import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import BungalowInfos from "@/components/BungalowInfos";
import Button from "@/components/Button";
import { Link } from "@/i18n/navigation";
import { getBungalows, getReglages, texteLocalise } from "@/lib/data";
import { photosDe } from "@/lib/photos";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Bungalows" });
  return {
    title: t("metaTitre"),
    description: t("metaDescription"),
  };
}

export default async function BungalowsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Bungalows");

  const [bungalows, reglages] = await Promise.all([
    getBungalows(),
    getReglages(),
  ]);

  // Le bouton de demande n'a de sens que si au moins un studio est publié
  const reservationOuverte = bungalows.some((b) => b.publie);

  // Équipements présents dans tous les studios
  const communs =
    bungalows.length > 0
      ? bungalows[0].equipements.filter((code) =>
          bungalows.every((b) => b.equipements.includes(code)),
        )
      : [];

  return (
    <main className="flex-1 px-6 py-10 text-[#222222] md:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#8B3017]">
            {t("surtitre")}
          </p>
          <h1 className="text-3xl font-semibold text-[#2F6036] md:text-4xl">
            {t("titre")}
          </h1>
          <p className="mt-4 max-w-full leading-7">{t("intro")}</p>
        </header>

        <section className="mb-10">
          <div className="grid gap-8 md:grid-cols-3">
            {bungalows.map((bungalow) => {
              const photo = photosDe(bungalow.slug)[0];
              const resume = texteLocalise(bungalow.resume, locale);

              return (
                <article
                  key={bungalow.slug}
                  className="overflow-hidden rounded-lg bg-white shadow-sm"
                >
                  {photo && (
                    <div className="relative aspect-4/3">
                      <Image
                        src={photo}
                        alt={bungalow.nom}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}

                  <div className="p-4">
                    <h2 className="mb-3 text-xl font-semibold text-[#2F6036]">
                      {bungalow.nom}
                    </h2>

                    {resume && (
                      <p className="mb-5 leading-7 text-[#222222]">{resume}</p>
                    )}

                    {bungalow.publie ? (
                      <Link
                        href={`/bungalows/${bungalow.slug}`}
                        className="font-medium text-[#2F6036] underline underline-offset-4 hover:text-[#8B3017]"
                      >
                        {t("decouvrir")}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-500">
                        {t("bientot")}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {reservationOuverte && (
            <Button href="/reservation" className="mt-8">
              {t("reserver")}
            </Button>
          )}
        </section>

        <BungalowInfos
          equipements={communs}
          tarifs={reglages.afficherPrix ? reglages.tarifs : null}
          services={reglages.services}
          annonce={texteLocalise(reglages.annonce, locale) ?? null}
          conditions={texteLocalise(reglages.conditions, locale) ?? []}
        />
      </div>
    </main>
  );
}