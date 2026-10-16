import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Casa Noppalu | Bungalows à Saly, Sénégal",
    template: "%s | Casa Noppalu",
  },
  description:
    "Découvrez nos trois bungalows indépendants et climatisés à Saly, Niakhnakhal. Jardin arboré, piscine et plage à dix minutes à pied.",

};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className=" h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <Header/>
        {children}
        <Footer/>
        </body>
    </html>
  );
}
