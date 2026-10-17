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
import type { Equipement, IconeNom, LigneTarif } from "@/lib/bungalows";

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
  tarifs: LigneTarif[];
  tarifsNote?: string;
  conditions: string[];
};

export default function BungalowInfos({ equipements, tarifs, tarifsNote, conditions }: Props) {
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
          <h3 className="mb-2 text-lg font-semibold text-[#2F6036]">
          Tarifs
          </h3>
            <dl className="max-w-xl divide-y divide-[#C6B06B]/40 rounded-lg bg-[#FFFEF6] text-sm shadow-sm">
              {tarifs.map((t) => (
                <div key={t.libelle} className="flex justify-between gap-4 px-4 py-2">
                  <dt>{t.libelle}</dt>
                  <dd className="font-semibold">{t.prix}</dd>
                </div>
              ))}
            </dl>
            {tarifsNote && <p className="mt-3 text-sm text-gray-600">{tarifsNote}</p>}

          <h3 className="mb-2 mt-8 text-lg font-semibold text-[#2F6036]">
              Conditions de séjour
          </h3>
              <ul className="list-disc space-y-1 pl-5">
                   {conditions.map((c) => (
                     <li key={c}>{c}</li>
                    ))}
              </ul>
      </section>
    </>
  );
}