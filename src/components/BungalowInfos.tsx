import {
  BedDouble,
  Snowflake,
  Utensils,
  Wifi,
  Tv,
  Waves,
  type LucideIcon,
} from "lucide-react";
import Button from "@/components/Button";
import type { Equipement, IconeNom } from "@/lib/bungalows";

const icones: Record<IconeNom, LucideIcon> = {
  lit: BedDouble,
  clim: Snowflake,
  cuisine: Utensils,
  wifi: Wifi,
  tv: Tv,
  piscine: Waves,
};

type Props = {
  equipements: Equipement[];
  conditions: string[];
};

export default function BungalowInfos({ equipements, conditions }: Props) {
  return (
    <>
      <section className="rounded-lg bg-[#FFFEF6] p-6 shadow-sm md:p-8">
        <h2 className="mb-6 font-serif text-2xl text-[#2F6036]">Équipements</h2>

        <ul className="grid gap-4 md:grid-cols-2">
          {equipements.map((e) => {
            const Icone = icones[e.icone];
            return (
              <li key={e.libelle} className="flex items-start gap-3">
                <Icone
                  className="mt-0.5 h-6 w-6 shrink-0 text-[#2F6036]"
                  aria-hidden="true"
                />
                <span>{e.libelle}</span>
              </li>
            );
          })}
        </ul>

        <Button href="/contact" className="mt-8">
          Demander les disponibilités
        </Button>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-serif text-2xl text-[#2F6036]">
          Conditions et informations pratiques
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          {conditions.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>
    </>
  );
}