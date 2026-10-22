import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getBungalows } from "@/lib/data";
import "../globals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: {
      default: t("titre"),
      template: "%s | Casa Noppalu",
    },
    description: t("description"),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const bungalows = await getBungalows().catch(() => []);

  return (
    <html
      lang={locale}
      className=" h-full antialiased suppressHydrationWarning"
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
        <Header 
            bungalows={bungalows
            .filter((b) => b.publie)
            .map(({ slug, nom }) => ({ slug, nom }))}
            />
        {children}
        <Footer/>
        </NextIntlClientProvider>
        </body>
    </html>
  );
}
