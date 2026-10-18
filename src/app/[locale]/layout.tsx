import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "Casa Noppalu | Maison d'hôtes à Saly, Sénégal",
    template: "%s | Casa Noppalu",
  },
  description:
    "Découvrez nos trois bungalows indépendants et climatisés à Saly, Niakhnakhal. Jardin arboré, piscine et plage à dix minutes à pied.",

};

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

  return (
    <html
      lang={locale}
      className=" h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
        <Header/>
        {children}
        <Footer/>
        </NextIntlClientProvider>
        </body>
    </html>
  );
}
