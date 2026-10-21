import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Gallery from "@/components/Gallery";
import { getBungalows, texteLocalise } from "@/lib/data";
import { photosDe } from "@/lib/photos";
import Button from "@/components/Button";

export const revalidate = 60;

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Accueil");
  const bungalows = await getBungalows();
  const reservationOuverte = bungalows.some((b) => b.publie);

  const photosAccueil = [
    { src: "/images/jardin1.png", alt: t("photos.jardin1") },
    { src: "/images/jardin2.jpg", alt: t("photos.jardin2") },
    { src: "/images/jardin3.jpg", alt: t("photos.jardin3") },
    { src: "/images/jardin4.jpg", alt: t("photos.jardin4") },
    { src: "/images/piscine1.jpg", alt: t("photos.piscine1") },
    { src: "/images/plage.jpg", alt: t("photos.plage") },
  ];

  return (
    <main className="flex-1">
      {/* Section 1 : accueil et carrousel */}
      <section className="px-6 py-6 md:px-12 md:py-6">
        <div className="mx-auto grid max-w-6xl items-center gap-6 md:grid-cols-1">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#8B3017]">
              {t("surtitre")}
            </p>

            <h1 className="mb-4 text-3xl font-semibold leading-tight text-[#2F6036] md:text-4xl">
              {t("titre")}
            </h1>

            <p className="max-w-full text-base leading-7 text-[#222222]">
              {t("intro")}
            </p>
            {reservationOuverte && (
              <Button href="/reservation" className="mt-5">
                {t("reserver")}
              </Button>
            )}
          </div>

          <Gallery photos={photosAccueil} priority />
        </div>
      </section>

      {/* Section 2 : tous les studios */}
      <section id="bungalows" className="bg-[#FFFEF6] px-6 py-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-[#8B3017]">
              {t("bungalowsSurtitre")}
            </p>

            <h2 className="text-3xl font-semibold text-[#2F6036] md:text-4xl">
              {t("bungalowsTitre")}
            </h2>

            <p className="mt-4 w-full leading-7 text-[#222222]">
              {t("bungalowsIntro")}
            </p>
          </div>

          <div className="mb-22 grid gap-8 md:grid-cols-3">
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

                  <div className="p-6">
                    <h3 className="mb-3 text-xl font-semibold text-[#2F6036]">
                      {bungalow.nom}
                    </h3>

                    {resume && (
                      <p className="mb-5 leading-7 text-[#222222]">{resume}</p>
                    )}

                    <Link
                      href={
                        bungalow.publie
                          ? `/bungalows/${bungalow.slug}`
                          : "/bungalows"
                      }
                      className="font-medium text-[#2F6036] underline underline-offset-4 hover:text-[#8B3017]"
                    >
                      {bungalow.publie ? t("decouvrir") : t("voirBungalows")}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}