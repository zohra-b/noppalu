import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Button from "@/components/Button";
import ReservationForm from "@/components/ReservationForm";
import {
  getBungalows,
  getReglages,
  getToutesIndisponibilites,
  texteLocalise,
} from "@/lib/data";
import { aujourdhuiSenegal } from "@/lib/sejour";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Reservation" });
  return {
    title: t("metaTitre"),
    description: t("metaDescription"),
  };
}

export default async function ReservationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Reservation");

  // Si la base est injoignable, on affiche un message plutôt qu'un formulaire qui ne marcherait pas
  const [bungalows, reglages, periodes] = await Promise.all([
    getBungalows().catch(() => []),
    getReglages().catch(() => null),
    getToutesIndisponibilites().catch(() => null),
  ]);

  const studios = bungalows
    .filter((b) => b.publie)
    .map((b) => ({
      slug: b.slug,
      nom: b.nom,
      capacite: b.capacite,
      litCm: b.litCm,
      resume: texteLocalise(b.resume, locale) ?? null,
    }));

  const tarifs = reglages?.afficherPrix ? reglages.tarifs : null;

  return (
    <main className="flex-1 px-6 py-10 text-[#222222] md:px-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-[#2F6036] md:text-4xl">
            {t("titre")}
          </h1>
          <p className="mt-4 leading-7">{t("intro")}</p>
        </header>

        {periodes && studios.length > 0 ? (
          <Suspense fallback={null}>
            <ReservationForm
              studios={studios}
              periodesParStudio={periodes}
              tarifs={tarifs}
              aujourdhui={aujourdhuiSenegal()}
            />
          </Suspense>
        ) : (
          <div>
            <p className="mb-4 leading-7">{t("indisponible")}</p>
            <Button href="/contact">{t("contact")}</Button>
          </div>
        )}
      </div>
    </main>
  );
}