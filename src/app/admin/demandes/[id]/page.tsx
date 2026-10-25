import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBungalows, getReglages } from "@/lib/data";
import {
  CLASSES_STATUT,
  LIBELLES_SOURCE,
  LIBELLES_STATUT,
  delaiDepasse,
  echeancePaiement,
  formaterDate,
  formaterDateHeure,
  getConflits,
  getDemande,
  pluriel,
  type Conflit,
} from "@/lib/demandes";
import {
  messageAcceptation,
  messageAnnulation,
  messageConfirmation,
  messageRefus,
} from "@/lib/messages-demande";
import { formaterMontantDouble } from "@/lib/monnaie";
import {
  coordonneesIncompletes,
  getCoordonneesPaiement,
} from "@/lib/paiement";
import {
  LIBELLES_ORIGINE,
  LIBELLES_PAIEMENT,
  confirmationAutomatique,
  estPlateforme,
} from "@/lib/reservations-types";
import { aujourdhuiSenegal, nombreNuits } from "@/lib/sejour";
import { requireAdmin } from "@/lib/supabase/session";
import EnteteAdmin from "../../EnteteAdmin";
import BoutonsDemande from "./BoutonsDemande";
import CopierMessage from "./CopierMessage";
import ModifierDates from "./ModifierDates";

export const metadata: Metadata = { title: "Demande" };

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CARTE = "rounded-lg bg-[#FFFEF6] p-4 shadow-sm";
const LIEN_CONTACT =
  "flex-1 rounded-md border border-green px-4 py-2 text-center text-sm font-medium text-green transition-colors hover:bg-green hover:text-linen";

function lienWhatsApp(telephone: string | null): string | null {
  if (!telephone) return null;
  let t = telephone.replace(/[^\d+]/g, "");
  if (t.startsWith("00")) t = `+${t.slice(2)}`;
  const chiffres = t.replace(/\D/g, "");
  return chiffres.length >= 8 ? `https://wa.me/${chiffres}` : null;
}

function Ligne({ libelle, valeur }: { libelle: string; valeur: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-gray-600">{libelle}</dt>
      <dd className="text-right font-medium">{valeur}</dd>
    </div>
  );
}

export default async function DemandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const demande = await getDemande(id);
  if (!demande) notFound();

  const studios = await getBungalows().catch(() => []);
  const studio =
    studios.find((s) => s.slug === demande.studioSlug)?.nom ?? demande.studioSlug;

  // Les dates sont-elles encore libres ? (seulement utile tant que la demande est nouvelle)
  let conflits: Conflit[] | null = [];
  if (demande.statut === "nouvelle") {
    conflits = await getConflits(
      demande.studioSlug,
      demande.arrivee,
      demande.depart,
    ).catch((e) => {
      console.error("Admin : vérification des dates impossible", e);
      return null;
    });
  }
  const datesLibres = conflits === null ? true : conflits.length === 0; // la base refuse de toute façon un chevauchement

  const origine = demande.origine;
  const plateforme = estPlateforme(origine);
  const envoiAuto = confirmationAutomatique(origine, demande.email);

  const acceptee =
    demande.statut === "acceptee" || demande.statut === "en_attente_paiement";
  const payee = demande.statut === "payee";
  const refusee = demande.statut === "refusee";
  const annulee = demande.statut === "expiree";
  const aUnMessage = acceptee || payee || refusee || annulee;
  const etaitPayee = demande.payeeLe !== null;

  const paiement = acceptee ? await getCoordonneesPaiement() : null;
  const echeance = echeancePaiement(demande);
  const enRetard = delaiDepasse(demande);
  // Dates et montant modifiables tant que la réservation est acceptée ou payée
  const modifiable = acceptee || payee;
  const reglages = modifiable ? await getReglages().catch(() => null) : null;

  const nuits = nombreNuits(demande.arrivee, demande.depart);
  const whatsapp = lienWhatsApp(demande.telephone);
  const nomClient = demande.nom ?? "Client sans nom";

  const donneesMessage = {
    nom: demande.nom,
    studio,
    arrivee: demande.arrivee,
    depart: demande.depart,
    nuits,
    voyageurs: demande.voyageurs,
    montantFcfa: demande.estimation,
    origine,
  };

  // Message prérempli selon l'avancement de la réservation
  const message = acceptee
    ? messageAcceptation({ ...donneesMessage, paiement }, demande.langue)
    : payee
      ? messageConfirmation({ ...donneesMessage, paiement: null }, demande.langue)
      : refusee
        ? messageRefus({ ...donneesMessage, paiement: null }, demande.langue)
        : annulee
          ? messageAnnulation(
              { ...donneesMessage, paiement: null, reservationPayee: etaitPayee },
              demande.langue,
            )
          : {
              sujet: "Casa Noppalu - Votre demande de réservation",
              texte: [
                demande.nom ? `Bonjour ${demande.nom},` : "Bonjour,",
                "",
                `Merci pour votre demande de réservation du studio ${studio}, du ${formaterDate(demande.arrivee)} au ${formaterDate(demande.depart)} (${pluriel(nuits, "nuit")}${demande.voyageurs ? `, ${pluriel(demande.voyageurs, "voyageur")}` : ""}).`,
                "",
                "",
              ].join("\n"),
            };

  const titreMessage = acceptee
    ? plateforme
      ? "Message de paiement"
      : "Message d'acceptation"
    : payee
      ? "Message de confirmation"
      : refusee
        ? "Message de refus"
        : "Message d'annulation";

  const mailto = demande.email
    ? `mailto:${demande.email}?subject=${encodeURIComponent(message.sujet)}&body=${encodeURIComponent(message.texte)}`
    : null;
  const lienWa = whatsapp
    ? `${whatsapp}?text=${encodeURIComponent(message.texte)}`
    : null;

  return (
    <>
      <EnteteAdmin />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-3 px-4 py-5">
        <Link
          href="/admin/reservations"
          className="text-sm text-green underline underline-offset-4"
        >
          ← Réservations
        </Link>

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-green">
              {studio}
            </h1>
            <p className="text-sm text-gray-600">
              {LIBELLES_ORIGINE[origine]} · {nomClient} ·{" "}
              {formaterDate(demande.arrivee)} → {formaterDate(demande.depart)}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${CLASSES_STATUT[demande.statut]}`}
          >
            {LIBELLES_STATUT[demande.statut]}
          </span>
        </div>

        {/* Traitement : tout en haut, pour agir sans défiler */}
        <section className={`${CARTE} ${enRetard ? "border border-red-700" : ""}`}>
          <h2 className="mb-2 text-sm font-semibold text-green">
            Traiter la demande
          </h2>

          {acceptee &&
            (echeance ? (
              enRetard ? (
                <p className="mb-2 text-sm font-medium text-red-700">
                  Délai de paiement dépassé (échéance : le{" "}
                  {formaterDateHeure(echeance.toISOString())}). Enregistrez le
                  paiement s&apos;il est arrivé, ou libérez les dates.
                </p>
              ) : (
                <p className="mb-2 text-sm">
                  Paiement attendu avant le{" "}
                  {formaterDateHeure(echeance.toISOString())}.
                </p>
              )
            ) : (
              <p className="mb-2 text-sm">
                Paiement à encaisser (à l&apos;arrivée ou par un autre moyen).
              </p>
            ))}

          {payee && demande.payeeLe && (
            <p className="mb-2 text-sm">
              Payée le {formaterDateHeure(demande.payeeLe)}
              {demande.moyenPaiement
                ? ` · ${LIBELLES_PAIEMENT[demande.moyenPaiement]}`
                : ""}
              .
            </p>
          )}
          {payee && envoiAuto && (
            <p
              className={`mb-2 text-sm ${
                demande.confirmationEnvoyeeLe
                  ? "text-green"
                  : "font-medium text-[#8B3017]"
              }`}
            >
              {demande.confirmationEnvoyeeLe
                ? `Confirmation envoyée au client le ${formaterDateHeure(demande.confirmationEnvoyeeLe)}.`
                : "La confirmation n'a pas encore été envoyée au client."}
            </p>
          )}

          <BoutonsDemande
            id={demande.id}
            statut={demande.statut}
            datesLibres={datesLibres}
            email={demande.email}
            envoiAuto={envoiAuto}
          />
        </section>

        {modifiable && (
          <ModifierDates
            id={demande.id}
            arrivee={demande.arrivee}
            depart={demande.depart}
            montant={demande.estimation}
            tarifs={reglages ? reglages.tarifs : null}
            aujourdhui={aujourdhuiSenegal()}
          />
        )}

        {demande.statut === "nouvelle" && (
          <section
            className={`${CARTE} ${datesLibres ? "" : "border border-red-700"}`}
          >
            <h2 className="mb-1 text-sm font-semibold text-green">
              Disponibilité
            </h2>
            {conflits === null ? (
              <p className="text-sm text-gray-600">
                Vérification impossible pour le moment. La base refusera de
                toute façon des dates déjà bloquées.
              </p>
            ) : conflits.length === 0 ? (
              <p className="text-sm text-green">
                Les dates sont toujours libres pour ce studio.
              </p>
            ) : (
              <div className="text-sm text-red-700">
                <p className="mb-1 font-medium">
                  Ces dates ne sont plus libres pour ce studio :
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  {conflits.map((c) => (
                    <li key={`${c.debut}-${c.fin}`}>
                      du {formaterDate(c.debut)} au {formaterDate(c.fin)} (
                      {LIBELLES_SOURCE[c.source] ?? c.source}
                      {c.nom ? `, ${c.nom}` : ""})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <section className={CARTE}>
          <h2 className="mb-1 text-sm font-semibold text-green">Séjour</h2>
          <dl className="divide-y divide-[#C6B06B]/40">
            <Ligne libelle="Arrivée" valeur={formaterDate(demande.arrivee)} />
            <Ligne libelle="Départ" valeur={formaterDate(demande.depart)} />
            <Ligne libelle="Durée" valeur={pluriel(nuits, "nuit")} />
            {demande.voyageurs !== null && (
              <Ligne libelle="Voyageurs" valeur={demande.voyageurs} />
            )}
            {demande.estimation !== null && (
              <Ligne
                libelle={origine === "site" ? "Estimation" : "Montant"}
                valeur={formaterMontantDouble(demande.estimation)}
              />
            )}
          </dl>
        </section>
        {demande.message && (
          <section className={CARTE}>
            <h2 className="mb-2 text-sm font-semibold text-green">
              {origine === "site" ? "Message du client" : "Note"}
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-6">
              {demande.message}
            </p>
          </section>
        )}
        <section className={CARTE}>
          <h2 className="mb-1 text-sm font-semibold text-green">Client</h2>
          <dl className="divide-y divide-[#C6B06B]/40">
            <Ligne libelle="Nom" valeur={nomClient} />
            <Ligne
              libelle="E-mail"
              valeur={
                demande.email ? (
                  <span className="break-all">{demande.email}</span>
                ) : (
                  "Non renseigné"
                )
              }
            />
            <Ligne
              libelle="Téléphone"
              valeur={demande.telephone ?? "Non renseigné"}
            />
            <Ligne libelle="Langue" valeur={demande.langue} />
            <Ligne
              libelle="Reçue le"
              valeur={formaterDateHeure(demande.creeeLe)}
            />
          </dl>

          <div className="mt-3 flex flex-wrap gap-2">
            {mailto && (
              <a href={mailto} className={LIEN_CONTACT}>
                Écrire par e-mail
              </a>
            )}
            {lienWa && (
              <a
                href={lienWa}
                target="_blank"
                rel="noopener noreferrer"
                className={LIEN_CONTACT}
              >
                WhatsApp
              </a>
            )}
            {aUnMessage && <CopierMessage texte={message.texte} />}
            {demande.telephone && (
              <a
                href={`tel:${demande.telephone.replace(/[^\d+]/g, "")}`}
                className={LIEN_CONTACT}
              >
                Appeler
              </a>
            )}
          </div>
          {demande.telephone && (
            <p className="mt-2 text-xs text-gray-500">
              Si le numéro ne commence pas par l&apos;indicatif du pays, le lien
              WhatsApp peut échouer.
            </p>
          )}
        </section>

        {aUnMessage && (
          <section className={CARTE}>
            <h2 className="mb-2 text-sm font-semibold text-green">
              {titreMessage}
            </h2>

            {acceptee && coordonneesIncompletes(paiement) && (
              <p className="mb-3 text-sm font-medium text-[#8B3017]">
                Coordonnées de paiement incomplètes : complétez la table
                payment_details dans Supabase avant d&apos;envoyer ce message.
                Les passages entre crochets sont à remplacer.
              </p>
            )}

            {(refusee || annulee || (payee && !envoiAuto)) && (
              <p className="mb-3 text-sm text-gray-600">
                Rien n&apos;est envoyé automatiquement : envoyez ce message au
                client (e-mail ou WhatsApp) après l&apos;avoir relu.
              </p>
            )}

            {annulee && etaitPayee && !plateforme && (
              <p className="mb-3 text-sm font-medium text-[#8B3017]">
                Cette réservation avait été payée : réglez le remboursement avec
                le client, selon la politique d&apos;annulation, et précisez-le
                dans le message.
              </p>
            )}

            <p className="mb-2 text-xs text-gray-500">
              Objet : {message.sujet}
            </p>
            <p className="whitespace-pre-wrap text-sm leading-6">
              {message.texte}
            </p>
          </section>
        )}

        
      </main>
    </>
  );
}