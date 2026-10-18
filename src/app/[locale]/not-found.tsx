import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <main className="flex-1 px-6 py-16 md:px-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-3xl font-semibold text-green">{t("titre")}</h1>
        <p className="mb-6 leading-7 text-[#222222]">{t("texte")}</p>
        <div className="flex flex-wrap gap-6">
          <Link href="/" className="font-medium text-green underline underline-offset-4 hover:text-sand">
            {t("accueil")}
          </Link>
          <Link href="/bungalows" className="font-medium text-green underline underline-offset-4 hover:text-sand">
            {t("bungalows")}
          </Link>
          <Link href="/contact" className="font-medium text-green underline underline-offset-4 hover:text-sand">
            {t("contact")}
          </Link>
        </div>
      </div>
    </main>
  );
}