import { getTranslations, setRequestLocale } from "next-intl/server";
import Button from "@/components/Button";
import Gallery from "@/components/Gallery";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Accueil");

  const photosAccueil = [
    { src: "/images/jardin1.png", alt: t("photos.jardin1") },
    { src: "/images/maison-depuis-terrasse.jpg", alt: t("photos.maison-depuis-terrasse") },
    { src: "/images/jardin-depuis-coinRepas.jpeg", alt: t("photos.jardin-depuis-coinRepas") },
    { src: "/images/piscine1.jpg", alt: t("photos.piscine1") },
    { src: "/images/jardin2.jpg", alt: t("photos.jardin2") },
    { src: "/images/jardin3.jpg", alt: t("photos.jardin3") },
    { src: "/images/jardin4.jpg", alt: t("photos.jardin4") },
    { src: "/images/porte-exterieure-ext.jpeg", alt: t("photos.porte-exterieure-ext") },
    { src: "/images/plage-coucher-de-soleil.jpg", alt: t("photos.plage") },
  ];

  return (
    <main className="flex-1">
      <section className="px-6 pb-12 pt-6 md:px-12">
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

            <Button href="/bungalows" className="mt-5">
              {t("voirStudios")}
            </Button>
          </div>

          <Gallery photos={photosAccueil} priority />
        </div>
      </section>
    </main>
  );
}