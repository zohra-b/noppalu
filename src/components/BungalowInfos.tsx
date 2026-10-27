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
import { Link } from "@/i18n/navigation";
import { texteLocalise, type EquipementCode, type Service } from "@/lib/data";
import {
  PERIODES,
  formaterJourMois,
  type SaisonCle,
  type Tarifs,
} from "@/lib/saisons";
import { avecGras } from "@/lib/avec-gras";

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
  services: Service[];
  annonce: string | null; // texte libre affiché au-dessus des tarifs
  conditions: string[];
  
};

export default function BungalowInfos({
  litCm,
  equipements,
  tarifs,
  services,
  annonce,
  conditions,
}: Props) {
  const t = useTranslations("BungalowInfos");
  const locale = useLocale();
  const formaterPrix = (n: number) => new Intl.NumberFormat(locale).format(n);
  const prixVisibles = tarifs !== null;

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

  // Une ligne par service : « Nom (20 000 FCFA) », ou « Nom (nous consulter) » si le prix est vide ou masqué
  const lignesServices = services
    .map((s) => {
      const nom = texteLocalise(s.nom, locale);
      if (!nom) return null;
      if (!prixVisibles || s.prix === null) {
        return { cle: s.id, texte: t("service.consulter", { nom }) };
      }
      return {
        cle: s.id,
        texte: s.unite
          ? t("service.prixUnite", {
              nom,
              prix: formaterPrix(s.prix),
              unite: t(`unites.${s.unite}`),
            })
          : t("service.prix", { nom, prix: formaterPrix(s.prix) }),
      };
    })
    .filter((l): l is { cle: string; texte: string } => l !== null);

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

        <h3 className="mb-2 text-lg font-semibold text-[#2F6036]">
          {t("tarifsTitre")}
        </h3>

        {annonce && (
          <p className="mb-3 max-w-xl whitespace-pre-line rounded-md border-l-4 border-[#C6B06B] bg-[#C6B06B]/20 px-4 py-3 text-sm">
            {avecGras(annonce)}
          </p>
        )}
        
        {prixVisibles ? (
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
        ) : (
          <p className="text-sm">
            <Link
              href="/contact"
              className="font-medium text-[#2F6036] underline underline-offset-4 hover:text-[#8B3017]"
            >
              {t("nousConsulter")}
            </Link>
          </p>
        )}

        {lignesServices.length > 0 && (
          <div className="mt-3 space-y-1 text-sm text-gray-600">
            {lignesServices.map((l) => (
              <p key={l.cle}>{l.texte}</p>
            ))}
          </div>
        )}

        {conditions.length > 0 && (
          <ul className="mt-6 list-disc space-y-1 pl-5">
            {conditions.map((c, i) => (
              <li key={i}>{avecGras(c)}</li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}