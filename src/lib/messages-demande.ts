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

const POLITIQUE_ANNULATION_ES =
  "reembolso del 100 % si cancela 15 días o más antes de la llegada, del 50 % entre 14 y 8 días antes, y ningún reembolso con 7 días o menos de antelación.";

const POLITIQUE_ANNULATION_EN =
  "a 100% refund if you cancel 15 days or more before arrival, 50% between 14 and 8 days before, and no refund 7 days or less before arrival.";

function dateLongue(cle: string, locale: string): string {
  const [a, m, j] = cle.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(a, m - 1, j)));
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

const SALUTATIONS: Record<string, string> = {
  fr: "Bonjour",
  es: "Hola",
  en: "Hello",
};

const salutation = (nom: string | null, langue: string) => {
  const mot = SALUTATIONS[langue] ?? SALUTATIONS.fr;
  return nom ? `${mot} ${nom},` : `${mot},`;
};

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
    // ? `Montant du séjour : ${montant}, à régler à votre arrivée en espèces, ou à l'avance par l'un des moyens ci-dessous.`
      ? `Montant du séjour : ${montant}, à régler à l'avance par l'un des moyens ci-dessous.`
      : `Montant du séjour : ${montant}, à régler en totalité sous 72 h.`;

    const moyens = plateforme
    // ? " "(espèces à l'arrivée, virement bancaire, Wave ou PayPal)"
      ? "(virement bancaire, Wave ou PayPal)"
      : "(virement bancaire, Wave ou PayPal)";

    const lignes = [
      salutation(d.nom, locale),
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
      salutation(d.nom, locale),
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
      salutation(d.nom, locale),
      "",
      `Merci pour votre demande de séjour au studio ${d.studio}, du ${a} au ${dep}. Malheureusement, nous ne pouvons pas y donner suite : nos studios ne sont pas disponibles à ces dates.`,
      "",
      "Si vos dates sont flexibles, ou si un autre studio vous convient, répondez simplement à ce message : nous regarderons ensemble ce qui est possible.",
      "",
      "À bientôt !",
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

    const lignes = [salutation(d.nom, locale), ""];

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

const es: Generateur = {
  acceptation(d, locale) {
    const a = dateLongue(d.arrivee, locale);
    const dep = dateLongue(d.depart, locale);
    const plateforme = estPlateforme(d.origine);
    const p = d.paiement;
    const montant =
      d.montantFcfa !== null
        ? `${formaterFcfa(d.montantFcfa, locale)} (${formaterEuros(enEuros(d.montantFcfa), locale)})`
        : "[monto a indicar]";

    const intro =
      d.origine === "site"
        ? `¡Buenas noticias: el estudio ${d.studio} está disponible del ${a} al ${dep} (${detailSejour(d)}), ¡te lo reservamos! 🌴`
        : `¡Gracias por tu reserva! El estudio ${d.studio} está reservado del ${a} al ${dep} (${detailSejour(d)}). 🌴`;

    const reglement = plateforme
    // ? `Importe de la estancia: ${montant}, a pagar a su llegada en efectivo, o por adelantado mediante uno de los medios siguientes.`
      ? `Importe total: ${montant}, a pagar por adelantado mediante uno de los medios siguientes.`
      : `Importe total: ${montant}, a pagar en su totalidad en un plazo de 72 h.`;

    const moyens = plateforme
    //? "(en efectivo a la llegada, transferencia bancaria, Wave o PayPal)"
      ? "(transferencia bancaria, Wave o PayPal)"
      : "(transferencia bancaria, Wave o PayPal)";

    const lignes = [
      salutation(d.nom, locale),
      "",
      intro,
      "",
      reglement,
      "",
      "Puedes realizar el pago mediante:",
      `– Wave : ${p?.wave ?? "[número a indicar]"}`,
      `– Transferencia bancaria : IBAN ${p?.iban ?? "[IBAN a indicar]"}, titular ${p?.titulaire ?? "[titular a indicar]"}. Por favor, indica en el concepto el nombre de la persona que realizó la solicitud.`,
      `– PayPal : ${p?.paypal ?? "[dirección a indicar]"}`,
      "",
      `Por favor, indícanos el método de pago que has elegido ${moyens}. Si pagas mediante transferencia, envíanos el comprobante.`,
      "",
    ];

    if (!plateforme) {
      lignes.push(
        `Cancelación : ${POLITIQUE_ANNULATION_ES}`,
        "",
        "Tan pronto como recibamos el pago, te enviaremos la confirmación de tu reserva.",
        "",
      );
    }
    lignes.push("¡Hasta pronto!", "El equipo de Casa Noppalu");

    return {
      sujet: `Casa Noppalu - Su estancia del ${a} al ${dep}`,
      texte: lignes.join("\n"),
    };
  },

  confirmation(d, locale) {
    const a = dateLongue(d.arrivee, locale);
    const dep = dateLongue(d.depart, locale);
    const plateforme = estPlateforme(d.origine);

    const premier = plateforme
      ? "¡Gracias por tu reserva! ¡Estamos encantados de recibirte en Saly!"
      : "¡Recibido, gracias! Tu pago ha llegado y tu reserva está confirmada. ¡Estamos encantados de recibirte en Saly!";

    const paragraphes = [
      salutation(d.nom, locale),
      premier,
      `Estudio ${d.studio}, del ${a} al ${dep} (${detailSejour(d)}). Llegada a partir de las 14:00, salida antes de las 11:00 (consigna de equipaje gratuita).`,
      `Dónde encontrarnos : ${ADRESSE}\n${LIEN_MAPS}`,
      "El traslado desde o hacia el aeropuerto es posible bajo petición: solo díganos la hora de su vuelo.",
      ...(plateforme
        ? []
        : [`Recordatorio - cancelación : ${POLITIQUE_ANNULATION_ES}`]),
      `¿Alguna pregunta? Simplemente responde a este correo electrónico o escríbenos por WhatsApp : ${LIEN_WHATSAPP}\n¡Hasta pronto!\nEl equipo de Casa Noppalu`,
    ];

    return {
      sujet: "Casa Noppalu - ¡Tu reserva está confirmada!",
      texte: paragraphes.join("\n\n"),
      html: versHtml(paragraphes),
    };
  },

  refus(d, locale) {
    const a = dateLongue(d.arrivee, locale);
    const dep = dateLongue(d.depart, locale);

    const texte = [
      salutation(d.nom, locale),
      "",
      `Gracias por su solicitud de estancia en el estudio ${d.studio}, del ${a} al ${dep}. Desafortunadamente, no podemos darles curso: nuestros estudios no están disponibles en esas fechas.`,
      "",
     "Si tiene flexibilidad en las fechas o le interesa otro estudio, simplemente responda a este mensaje y estaremos encantados de estudiar las opciones disponibles.",
      "",
      "¡Hasta pronto !",
      "El equipo de Casa Noppalu",
    ].join("\n");

    return { sujet: `Casa Noppalu - Su solicitud del ${a} al ${dep}`, texte };
  },

  annulation(d, locale) {
    const a = dateLongue(d.arrivee, locale);
    const dep = dateLongue(d.depart, locale);
    const payee = d.reservationPayee === true;
    const plateforme = estPlateforme(d.origine);
    const objet = payee || d.origine !== "site" ? "reserva" : "solicitud";

    const lignes = [salutation(d.nom, locale), ""];

    if (plateforme) {
      lignes.push(
        `Te confirmamos la cancelación de tu reserva para el estudio ${d.studio}, del ${a} al ${dep}. Estas fechas vuelven a estar disponibles`,
        "",
      );
    } else if (payee) {
      lignes.push(
        `Le confirmamos la cancelación de su reserva para el estudio ${d.studio}, del ${a} al ${dep}. Estas fechas vuelven a estar disponibles.`,
        "",
        `Nos pondremos en contacto con usted respecto a un posible reembolso, de acuerdo con nuestra política de cancelación : ${POLITIQUE_ANNULATION_ES}`,
        "",
      );
    } else {
      lignes.push(
        `Hasta la fecha, no hemos recibido el pago correspondiente a su ${objet}, que se tenía que pagar en un plazo de 72 horas desde su aceptación.`,
        "",
        `Por lo tanto, le confirmamos la cancelación de su ${objet} para el estudio ${d.studio}, del ${a} al ${dep}. Estas fechas vuelven a estar disponibles.`,
        "",
        "Si todavía desea alojarse con nosotros, simplemente responda a este mensaje y estaremos encantados de estudiar las opciones disponibles.",
        "",
      );
    }
    lignes.push("¡Hasta pronto !", "El equipo de Casa Noppalu");

    return {
      sujet: `Casa Noppalu - Cancelación de su ${objet} del ${a} al ${dep}`,
      texte: lignes.join("\n"),
    };
  },
};

const en: Generateur = {
  acceptation(d, locale) {
    const a = dateLongue(d.arrivee, locale);
    const dep = dateLongue(d.depart, locale);
    const plateforme = estPlateforme(d.origine);
    const p = d.paiement;
    const montant =
      d.montantFcfa !== null
        ? `${formaterFcfa(d.montantFcfa, locale)} (${formaterEuros(enEuros(d.montantFcfa), locale)})`
        : "[amount to be indicated]";

    const intro =
      d.origine === "site"
        ? `Good news: the ${d.studio} studio is available from ${a} to ${dep} (${detailSejour(d)}), we are holding it for you! 🌴`
        : `Thank you for your booking! The studio ${d.studio} is successfully booked from ${a} to ${dep} (${detailSejour(d)}). 🌴`;

    const reglement = plateforme
    //? `Total amount: ${montant}, to be paid upon arrival in cash, or in advance via one of the methods below.`
      ? `Total amount: ${montant}, to be paid in advance via one of the methods below.`
      : `Total amount: ${montant}, to be paid in full within 72 hours.`;

    const moyens = plateforme
    // ? "(cash upon arrival, bank transfer, Wave or PayPal)"
      ? "(bank transfer, Wave or PayPal)"
      : "(bank transfer, Wave or PayPal)";

    const lignes = [
      salutation(d.nom, locale),
      "",
      intro,
      "",
      reglement,
      "",
      "You can pay using one of the following methods:",
      `– Wave : ${p?.wave ?? "[number to be indicated]"}`,
      `– Bank transfer : IBAN ${p?.iban ?? "[IBAN to be indicated]"}, account holder ${p?.titulaire ?? "[holder to be indicated]"}. Please indicate the name used for the booking in the payment reference.`,
      `– PayPal : ${p?.paypal ?? "[address to be indicated]"}`,
      "",
      `Please let us know which payment method you have chosen ${moyens}. If you pay by bank transfer, please also send us the receipt.`,
      "",
    ];

    if (!plateforme) {
      lignes.push(
        `Cancellation: ${POLITIQUE_ANNULATION_EN}`,
        "",
        "Once we have received your payment, we will send you your booking confirmation.",
        "",
      );
    }
    lignes.push("See you soon!", "The Casa Noppalu team");

    return {
      sujet: `Casa Noppalu - Your stay from ${a} to ${dep}`,
      texte: lignes.join("\n"),
    };
  },

  confirmation(d, locale) {
    const a = dateLongue(d.arrivee, locale);
    const dep = dateLongue(d.depart, locale);
    const plateforme = estPlateforme(d.origine);

    const premier = plateforme
      ? "Thank you for your booking! We look forward to welcoming you to Saly!"
      : "Received, thank you! Your payment has arrived and your booking is confirmed. We look forward to welcoming you to Saly!";

    const paragraphes = [
      salutation(d.nom, locale),
      premier,
      `Studio ${d.studio}, from ${a} to ${dep} (${detailSejour(d)}). Arrival from 2:00 PM, departure before 11:00 AM (free luggage storage).`,
      `Where to find us: ${ADRESSE}\n${LIEN_MAPS}`,
      "Airport transfer to or from the airport is available upon request: just let us know your flight time.",
      ...(plateforme
        ? []
        : [`Reminder - cancellation: ${POLITIQUE_ANNULATION_EN}`]),
      `Any questions? Simply reply to this email or write to us on WhatsApp: ${LIEN_WHATSAPP}\nSee you soon!\nThe Casa Noppalu team`,
    ];

    return {
      sujet: "Casa Noppalu - Your booking is confirmed!",
      texte: paragraphes.join("\n\n"),
      html: versHtml(paragraphes),
    };
  },

  refus(d, locale) {
    const a = dateLongue(d.arrivee, locale);
    const dep = dateLongue(d.depart, locale);

    const texte = [
      salutation(d.nom, locale),
      "",
      `Thank you for your request for a stay in studio ${d.studio}, from ${a} to ${dep}. Unfortunately, we are unable to accommodate your request, as our studios are fully booked for these dates.`,
      "",
      "If your dates are flexible or you would consider another studio, simply reply to this message, and we will be happy to explore the available options with you.",
      "",
      "Hope to see you soon!",
      "The Casa Noppalu team",
    ].join("\n");

    return { sujet: `Casa Noppalu - Your request from ${a} to ${dep}`, texte };
  },

  annulation(d, locale) {
    const a = dateLongue(d.arrivee, locale);
    const dep = dateLongue(d.depart, locale);
    const payee = d.reservationPayee === true;
    const plateforme = estPlateforme(d.origine);
    const objet = payee || d.origine !== "site" ? "booking" : "request";

    const lignes = [salutation(d.nom, locale), ""];

    if (plateforme) {
      lignes.push(
        `We confirm the cancellation of your booking for studio ${d.studio}, from ${a} to ${dep}. The dates are now available again.`,
        "",
      );
    } else if (payee) {
      lignes.push(
        `We confirm the cancellation of your booking for studio ${d.studio}, from ${a} to ${dep}. The dates are now available again.`,
        "",
        `We will contact you regarding any refund due, in accordance with our cancellation policy: ${POLITIQUE_ANNULATION_EN}`,
        "",
      );
    } else {
      lignes.push(
        `We have not yet received payment for your ${objet}, which was due within 72 hours of acceptance of your booking request.`,
        "",
        `We therefore confirm the cancellation of your ${objet} for studio ${d.studio}, from ${a} to ${dep}. These dates are now available again.`,
        "",
        "If you still wish to stay with us, simply reply to this message, and we will be happy to explore the available options with you.",
        "",
      );
    }
    lignes.push("Hope to welcome you soon!", "The Casa Noppalu team");

    return {
      sujet: `Casa Noppalu - Cancellation of your ${objet} from ${a} to ${dep}`,
      texte: lignes.join("\n"),
    };
  },
};

const GENERATEURS: Record<string, Generateur> = { fr, es, en };

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