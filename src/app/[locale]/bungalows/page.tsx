import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import BungalowInfos from "@/components/BungalowInfos";
import { getBungalows, getReglages, texteLocalise } from "@/lib/data";

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

  // Équipements présents dans tous les studios
  const communs =
    bungalows.length > 0
      ? bungalows[0].equipements.filter((code) =>
          bungalows.every((b) => b.equipements.includes(code))
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

        <BungalowInfos
          equipements={communs}
          tarifs={reglages.afficherPrix ? reglages.tarifs : null}
          prixTransfert={reglages.afficherPrix ? reglages.prixTransfert : null}
          conditions={texteLocalise(reglages.conditions, locale) ?? []}
        />
      </div>
    </main>
  );
}