import type { Metadata } from "next";
import { infosCommunes } from "@/lib/bungalows";
import BungalowInfos from "@/components/BungalowInfos";

export const metadata: Metadata = {
  title: "Nos bungalows – Casa Noppalu, Saly",
  description:
    "Trois bungalows indépendants et climatisés à Saly, avec climatisation, kitchenette, Wi-Fi et accès à la piscine.",
};

export default function BungalowsPage() {
  return (
    <main className="flex-1 px-6 py-10 text-[#222222] md:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#8B3017]">
            Votre séjour
          </p>
          <h1 className="text-3xl font-semibold text-[#2F6036] md:text-4xl">
            Nos bungalows
          </h1>
          <p className="mt-4 max-w-full leading-7">
            Casa Noppalu dispose de trois bungalows indépendants pour recevoir deux personnes. Climatisés et dotés d'un coin kitchenette,
            ils offrent un espace privé pour profiter pleinement de votre séjour à Saly, avec un accès à la piscine et au jardin.
          </p>
        </header>

        <BungalowInfos {...infosCommunes} />
      </div>
    </main>
  );
}