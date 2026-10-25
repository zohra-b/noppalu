import { enEuros, formaterEuros, formaterFcfa } from "@/lib/monnaie";
import { estPlateforme, type OrigineDemande } from "@/lib/reservations-types";

export type CoordonneesMessage = {
  wave: string | null;
  iban: string | null;
  titulaire: string | null;
  paypal: string | null;
};

export type DonneesMessage = {
  nom: string | null;
  studio: string;
  arrivee: string; // AAAA-MM-JJ
  depart: string; // AAAA-MM-JJ
  nuits: number;
  voyageurs: number | null;
  montantFcfa: number | null;
  paiement: CoordonneesMessage | null;
  origine: OrigineDemande;
  reservationPayee?: boolean; // utile pour le message d'annulation
};

export type Message = { sujet: string; texte: string };
export type MessageHtml = Message & { html: string };

type Generateur = {
  acceptation: (d: DonneesMessage, locale: string) => Message;
  confirmation: (d: DonneesMessage, locale: string) => MessageHtml;
  refus: (d: DonneesMessage, locale: string) => Message;
  annulation: (d: DonneesMessage, locale: string) => Message;
};

const ADRESSE = "Piste des Charrettes, Angle Serigne Falou, Saly Niakhnakhal";
const LIEN_MAPS =
  "https://www.google.com/maps/search/?api=1&query=C2J3%2BF9W%20Mbour%20Senegal";
const LIEN_WHATSAPP = "https://wa.me/34637251773";

const POLITIQUE_ANNULATION_FR =
  "remboursement à 100 % si vous annulez 15 jours ou plus avant l'arrivée, à 50 % entre 14 et 8 jours avant, aucun remboursement à 7 jours ou moins.";

function dateLongue(cle: string, locale: string): string {
  const [a, m, j] = cle.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(a, m - 1, j)));
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

const salutation = (nom: string | null) =>
  nom ? `Bonjour ${nom},` : "Bonjour,";

// « 3 nuits, 2 voyageurs » (le nombre de voyageurs peut être inconnu)
const detailSejour = (d: DonneesMessage) =>
  `${pluriel(d.nuits, "nuit")}${d.voyageurs ? `, ${pluriel(d.voyageurs, "voyageur")}` : ""}`;

const echapper = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Un paragraphe par bloc ; les adresses web deviennent des liens cliquables
const versHtml = (paragraphes: string[]) =>
  paragraphes
    .map(
      (p) =>
        `<p style="white-space:pre-line">${echapper(p).replace(
          /https?:\/\/[^\s<]+/g,
          (u) => `<a href="${u}">${u}</a>`,
        )}</p>`,
    )
    .join("");

const fr: Generateur = {
  acceptation(d, locale) {
    const a = dateLongue(d.arrivee, locale);
    const dep = dateLongue(d.depart, locale);
    const plateforme = estPlateforme(d.origine);
    const p = d.paiement;
    const montant =
      d.montantFcfa !== null
        ? `${formaterFcfa(d.montantFcfa, locale)} (${formaterEuros(enEuros(d.montantFcfa), locale)})`
        : "[montant à indiquer]";

    const intro =
      d.origine === "site"
        ? `Bonne nouvelle : le studio ${d.studio} est libre du ${a} au ${dep} (${detailSejour(d)}), on vous le réserve ! 🌴`
        : `Merci pour votre réservation ! Le studio ${d.studio} est bien réservé du ${a} au ${dep} (${detailSejour(d)}). 🌴`;

    const reglement = plateforme
      ? `Montant du séjour : ${montant}, à régler à votre arrivée en espèces, ou à l'avance par l'un des moyens ci-dessous.`
      : `Montant du séjour : ${montant}, à régler en totalité sous 72 h.`;

    const moyens = plateforme
      ? "(espèces à l'arrivée, virement bancaire, Wave ou PayPal)"
      : "(virement bancaire, Wave ou PayPal)";

    const lignes = [
      salutation(d.nom),
      "",
      intro,
      "",
      reglement,
      "",
      "Vous pouvez payer par :",
      `– Wave : ${p?.wave ?? "[numéro à indiquer]"}`,
      `– Virement bancaire : IBAN ${p?.iban ?? "[IBAN à indiquer]"}, titulaire ${p?.titulaire ?? "[titulaire à indiquer]"}. Merci d'indiquer en libellé le nom de la personne qui a effectué la réservation.`,
      `– PayPal : ${p?.paypal ?? "[adresse à indiquer]"}`,
      "",
      `Merci de nous préciser le mode de paiement choisi ${moyens}. Si vous payez par virement, envoyez-nous aussi le justificatif.`,
      "",
    ];

    // La politique d'annulation de Booking.com et d'Airbnb est celle de la plateforme
    if (!plateforme) {
      lignes.push(
        `Annulation : ${POLITIQUE_ANNULATION_FR}`,
        "",
        "Dès que nous aurons reçu votre paiement, nous vous enverrons la confirmation de votre réservation.",
        "",
      );
    }
    lignes.push("À très vite !", "L'équipe de Casa Noppalu");

    return {
      sujet: `Casa Noppalu - Votre séjour du ${a} au ${dep}`,
      texte: lignes.join("\n"),
    };
  },

  confirmation(d, locale) {
    const a = dateLongue(d.arrivee, locale);
    const dep = dateLongue(d.depart, locale);
    const plateforme = estPlateforme(d.origine);

    const premier = plateforme
      ? "Merci pour votre réservation ! On est ravis de vous accueillir à Saly !"
      : "Bien reçu, merci ! Votre paiement est arrivé et votre réservation est confirmée. On est ravis de vous accueillir à Saly !";

    const paragraphes = [
      salutation(d.nom),
      premier,
      `Studio ${d.studio}, du ${a} au ${dep} (${detailSejour(d)}). Arrivée à partir de 14 h, départ avant 11 h (bagagerie offerte).`,
      `Où nous trouver : ${ADRESSE}\n${LIEN_MAPS}`,
      "Un transfert depuis ou vers l'aéroport est possible sur demande : dites-nous simplement l'heure de votre vol.",
      ...(plateforme
        ? []
        : [`Rappel - annulation : ${POLITIQUE_ANNULATION_FR}`]),
      `Une question ? Répondez simplement à cet e-mail ou écrivez-nous sur WhatsApp : ${LIEN_WHATSAPP}\nÀ très vite !\nL'équipe de Casa Noppalu`,
    ];

    return {
      sujet: "Casa Noppalu - Votre réservation est confirmée !",
      texte: paragraphes.join("\n\n"),
      html: versHtml(paragraphes),
    };
  },

  refus(d, locale) {
    const a = dateLongue(d.arrivee, locale);
    const dep = dateLongue(d.depart, locale);

    const texte = [
      salutation(d.nom),
      "",
      `Merci pour votre demande de séjour au studio ${d.studio}, du ${a} au ${dep}. Malheureusement, nous ne pouvons pas y donner suite : nos studios ne sont pas disponibles à ces dates.`,
      "",
      "Si vos dates sont flexibles, ou si un autre studio vous convient, répondez simplement à ce message : nous regarderons ensemble ce qui est possible.",
      "",
      "À bientôt peut-être !",
      "L'équipe de Casa Noppalu",
    ].join("\n");

    return { sujet: `Casa Noppalu - Votre demande du ${a} au ${dep}`, texte };
  },

  annulation(d, locale) {
    const a = dateLongue(d.arrivee, locale);
    const dep = dateLongue(d.depart, locale);
    const payee = d.reservationPayee === true;
    const plateforme = estPlateforme(d.origine);
    // Une demande du site s'appelle « demande » tant qu'elle n'est pas payée ; les autres sont des réservations
    const objet = payee || d.origine !== "site" ? "réservation" : "demande";

    const lignes = [salutation(d.nom), ""];

    if (plateforme) {
      lignes.push(
        `Nous vous confirmons l'annulation de votre réservation pour le studio ${d.studio}, du ${a} au ${dep}. Les dates ont été libérées.`,
        "",
      );
    } else if (payee) {
      lignes.push(
        `Nous vous confirmons l'annulation de votre réservation pour le studio ${d.studio}, du ${a} au ${dep}. Les dates ont été libérées.`,
        "",
        `Nous reviendrons vers vous au sujet d'un éventuel remboursement, conformément à notre politique d'annulation : ${POLITIQUE_ANNULATION_FR}`,
        "",
      );
    } else {
      lignes.push(
        `À ce jour, nous n'avons pas reçu le paiement relatif à votre ${objet}, que nous vous demandions de régler dans les 72 h suivant son acceptation.`,
        "",
        `Nous vous confirmons donc l'annulation de votre ${objet} pour le studio ${d.studio}, du ${a} au ${dep}. Les dates ont été libérées.`,
        "",
        "Si vous souhaitez toujours séjourner chez nous, répondez simplement à ce message : nous regarderons ce qui est possible.",
        "",
      );
    }
    lignes.push("À bientôt peut-être !", "L'équipe de Casa Noppalu");

    return {
      sujet: `Casa Noppalu - Annulation de votre ${objet} du ${a} au ${dep}`,
      texte: lignes.join("\n"),
    };
  },
};

const GENERATEURS: Record<string, Generateur> = { fr };

// Langue non prévue : on écrit en français, dates comprises
function choisir(locale: string): { g: Generateur; langue: string } {
  return Object.hasOwn(GENERATEURS, locale)
    ? { g: GENERATEURS[locale], langue: locale }
    : { g: fr, langue: "fr" };
}

export function messageAcceptation(d: DonneesMessage, locale: string): Message {
  const { g, langue } = choisir(locale);
  return g.acceptation(d, langue);
}

export function messageConfirmation(
  d: DonneesMessage,
  locale: string,
): MessageHtml {
  const { g, langue } = choisir(locale);
  return g.confirmation(d, langue);
}

export function messageRefus(d: DonneesMessage, locale: string): Message {
  const { g, langue } = choisir(locale);
  return g.refus(d, langue);
}

export function messageAnnulation(d: DonneesMessage, locale: string): Message {
  const { g, langue } = choisir(locale);
  return g.annulation(d, langue);
}