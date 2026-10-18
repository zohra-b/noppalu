import {
  BedDouble,
  Snowflake,
  Utensils,
  Wifi,
  Tv,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/Button";
import type {
  ConditionCle,
  Equipement,
  IconeNom,
  LigneTarif,
} from "@/lib/bungalows";

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
  transfertAeroport?: number;
  conditions: ConditionCle[];
};

export default function BungalowInfos({
  equipements,
  tarifs,
  transfertAeroport,
  conditions,
}: Props) {
  const t = useTranslations("BungalowInfos");
  const locale = useLocale();
  const formaterPrix = (n: number) => new Intl.NumberFormat(locale).format(n);

  return (
    <>
      <section className="rounded-lg bg-[#FFFEF6] p-6 shadow-sm md:p-8">
        <h2 className="mb-6 font-serif text-2xl text-[#2F6036]">
          {t("equipementsTitre")}
        </h2>

        <ul className="grid gap-4 md:grid-cols-2">
          {equipements.map((e) => {
            const Icone = icones[e.icone];
            return (
              <li key={e.icone} className="flex items-start gap-3">
                <Icone
                  className="mt-0.5 h-6 w-6 shrink-0 text-[#2F6036]"
                  aria-hidden="true"
                />
                <span>{t(`equipements.${e.icone}`, { valeur: e.valeur ?? "" })}</span>
              </li>
            );
          })}
        </ul>

        <Button href="/contact" className="mt-8">
          {t("demanderDispo")}
        </Button>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-serif text-2xl text-[#2F6036]">
          {t("conditionsTitre")}
        </h2>

        <h3 className="mb-2 text-lg font-semibold text-[#2F6036]">
          {t("tarifsTitre")}
        </h3>
        <dl className="max-w-xl divide-y divide-[#C6B06B]/40 rounded-lg bg-[#FFFEF6] text-sm shadow-sm">
          {tarifs.map((tarif) => (
            <div key={tarif.cle} className="flex justify-between gap-4 px-4 py-2">
              <dt>{t(`tarifs.${tarif.cle}`)}</dt>
              <dd className="font-semibold">
                {t("tarifs.parNuit", { prix: formaterPrix(tarif.prix) })}
              </dd>
            </div>
          ))}
        </dl>
        {transfertAeroport && (
          <p className="mt-3 text-sm text-gray-600">
            {t("transfert", { prix: formaterPrix(transfertAeroport) })}
          </p>
        )}

        <h3 className="mb-2 mt-8 text-lg font-semibold text-[#2F6036]">
          {t("sejourTitre")}
        </h3>
        <ul className="list-disc space-y-1 pl-5">
          {conditions.map((c) => (
            <li key={c}>{t(`conditions.${c}`)}</li>
          ))}
        </ul>
      </section>
    </>
  );
}