import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Gallery from "@/components/Gallery";
import { bungalows } from "@/lib/bungalows";


export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Accueil");
  const tb = await getTranslations("Bungalows");
  
  const photosAccueil = [
    { src: "/images/jardin1.png", alt: "Le jardin de Casa Noppalu" },
    { src: "/images/jardin2.jpg", alt: "Une adorable salamandre" },
    { src: "/images/jardin3.jpg", alt: "La terrasse pour l'apéro" },
    { src: "/images/jardin4.jpg", alt: "Un escargot nous rend visite" },
    { src: "/images/piscine1.jpg", alt: "La piscine de Casa Noppalu" },
    { src: "/images/plage.jpg", alt: "La plage à proximité" },
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
          </div>

          <Gallery photos = {photosAccueil} priority/>
        
        </div>
      </section>

      {/* Section 2 : les trois bungalows */}
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
            {bungalows.map((bungalow) => (
  <article
    key={bungalow.slug}
    className="overflow-hidden rounded-lg bg-white shadow-sm"
  >
    <div className="relative aspect-4/3">
      <Image
        src={bungalow.photos[0]}
        alt={bungalow.nom}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
    </div>

    <div className="p-6">
      <h3 className="mb-3 text-xl font-semibold text-[#2F6036]">
        {bungalow.nom}
      </h3>

      <p className="mb-5 leading-7 text-[#222222]">
        {tb(`items.${bungalow.slug}.resume`)}
      </p>

      <Link
        href={bungalow.publie ? `/bungalows/${bungalow.slug}` : "/bungalows"}
        className="font-medium text-[#2F6036] underline underline-offset-4 hover:text-[#8B3017]"
      >
        {bungalow.publie ?  t("decouvrir") : t("voirBungalows")}
      </Link>
    </div>
  </article>
))}
          </div>
        </div>
      </section>
    </main>
  );
}