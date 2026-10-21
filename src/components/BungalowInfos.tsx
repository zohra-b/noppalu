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
import type { EquipementCode } from "@/lib/data";
import {
  PERIODES,
  formaterJourMois,
  type SaisonCle,
  type Tarifs,
} from "@/lib/saisons";

type CodeIcone = EquipementCode | "lit";

const icones: Record<CodeIcone, LucideIcon> = {
  lit: BedDouble,
  clim: Snowflake,
  cuisine: Utensils,
  wifi: Wifi,
  tv: Tv,
  piscine: Waves,
};

const SAISONS: SaisonCle[] = ["basse", "haute", "fetes"];

type Props = {
  litCm?: number;
  equipements: EquipementCode[];
  tarifs: Tarifs | null; // null = prix masqués
  prixTransfert: number | null;
  conditions: string[];
};

export default function BungalowInfos({
  litCm,
  equipements,
  tarifs,
  prixTransfert,
  conditions,
}: Props) {
  const t = useTranslations("BungalowInfos");
  const locale = useLocale();
  const formaterPrix = (n: number) => new Intl.NumberFormat(locale).format(n);

  const lignes: { code: CodeIcone; valeur?: string }[] = [
    ...(litCm ? [{ code: "lit" as const, valeur: `${litCm} cm` }] : []),
    ...equipements.map((code) => ({ code })),
  ];

  function libelleSaison(cle: SaisonCle) {
    if (cle === "fetes") {
      return t("tarifs.fetes", {
        debut: formaterJourMois(PERIODES.fetes.debut, locale),
        fin: formaterJourMois(PERIODES.fetes.fin, locale),
      });
    }
    return t(`tarifs.${cle}`);
  }

  return (
    <>
      <section className="rounded-lg bg-[#FFFEF6] p-6 shadow-sm md:p-8">
        <h2 className="mb-6 font-serif text-2xl text-[#2F6036]">
          {t("equipementsTitre")}
        </h2>

        <ul className="grid gap-4 md:grid-cols-2">
          {lignes.map((l) => {
            const Icone = icones[l.code];
            return (
              <li key={l.code} className="flex items-start gap-3">
                <Icone
                  className="mt-0.5 h-6 w-6 shrink-0 text-[#2F6036]"
                  aria-hidden="true"
                />
                <span>{t(`equipements.${l.code}`, { valeur: l.valeur ?? "" })}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-serif text-2xl text-[#2F6036]">
          {t("conditionsTitre")}
        </h2>

        {tarifs && (
          <>
            <h3 className="mb-2 text-lg font-semibold text-[#2F6036]">
              {t("tarifsTitre")}
            </h3>
            <dl className="max-w-xl divide-y divide-[#C6B06B]/40 rounded-lg bg-[#FFFEF6] text-sm shadow-sm">
              {SAISONS.map((cle) => (
                <div key={cle} className="flex justify-between gap-4 px-4 py-2">
                  <dt>{libelleSaison(cle)}</dt>
                  <dd className="font-semibold">
                    {t("tarifs.parNuit", { prix: formaterPrix(tarifs[cle]) })}
                  </dd>
                </div>
              ))}
            </dl>
            {prixTransfert && (
              <p className="mt-3 text-sm text-gray-600">
                {t("transfert", { prix: formaterPrix(prixTransfert) })}
              </p>
            )}
          </>
        )}

        {conditions.length > 0 && (
          <ul
            className={`list-disc space-y-1 pl-5 ${tarifs ? "mt-6" : ""}`}
          >
            {conditions.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}