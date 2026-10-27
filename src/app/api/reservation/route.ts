import { NextResponse } from "next/server";
import { Resend } from "resend";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBungalow, getReglages, getStudiosLibres } from "@/lib/data";
import { nombreNuits, validerSejour } from "@/lib/sejour";
import { prixDuSejour } from "@/lib/saisons";
import { validerEmail } from "@/lib/validation";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function erreur(code: string, status: number) {
  return NextResponse.json({ error: code }, { status });
}

const dateLoc = (s: string, locale: string) => {
  const [a, m, j] = s.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(a, m - 1, j)));
};
const montantLoc = (n: number, locale: string) =>
  new Intl.NumberFormat(locale).format(n);

// Textes de l'e-mail de confirmation envoyé au visiteur.
// Pour ajouter une langue : ajouter une entrée (ex. "en") ; sinon le français est utilisé.
const TEXTES_CONFIRMATION: Record<
  string,
  {
    sujet: string;
    bonjour: (nom: string) => string;
    intro: string;
    titre: string;
    studio: string;
    arrivee: string;
    depart: string;
    duree: (n: number) => string;
    voyageurs: string;
    estimation: string;
    estimationNote: string;
    telephone: string;
    email: string;
    nonRenseigne: string;
    votreMessage: string;
    pasReservation: string;
    annulation: string;
    correction: string;
    signature: string;
  }
> = {
  fr: {
    sujet: "Casa Noppalu - Nous avons bien reçu votre demande",
    bonjour: (nom) => `Bonjour ${nom},`,
    intro:
      "Merci pour votre demande. Nous l'avons bien reçue et nous vous répondrons dans les plus brefs délais.",
    titre: "Récapitulatif de votre demande",
    studio: "Studio",
    arrivee: "Arrivée",
    depart: "Départ",
    duree: (n) => `${n} nuit${n > 1 ? "s" : ""}`,
    voyageurs: "Voyageurs",
    estimation: "Estimation du séjour",
    estimationNote: "selon notre grille tarifaire actuelle",
    telephone: "Téléphone / WhatsApp",
    email: "E-mail",
    nonRenseigne: "Non renseigné",
    votreMessage: "Votre message",
    pasReservation:
      "Il s'agit d'une demande, pas encore d'une réservation : les dates ne sont pas bloquées tant que nous ne vous avons pas confirmé la disponibilité.",
    annulation:
      "Si votre demande est acceptée, nous vous adresserons une confirmation accompagnée d'une demande de paiement sous 72h afin dque votre réservation soit définitive. En cas d'annulation : remboursement à 100 % si vous annulez 15 jours ou plus avant l'arrivée, à 50 % entre 14 et 8 jours avant, aucun remboursement à 7 jours ou moins.",
    correction:
      "Une information est incorrecte, ou vous souhaitez préciser quelque chose ? Répondez simplement à cet e-mail.",
    signature: "À bientôt,\nL'équipe de Casa Noppalu",
  },

  en: {
    sujet: "Casa Noppalu - We've received your booking request",
    bonjour: (nom) => `Hello ${nom},`,
    intro:
      "Thank you for your request. We have received it and will get back to you as soon as possible.",
    titre: "Summary of your request",
    studio: "Studio",
    arrivee: "Arrival",
    depart: "Departure",
    duree: (n) => `${n} night${n > 1 ? "s" : ""}`,
    voyageurs: "Guests",
    estimation: "Estimated stay",
    estimationNote: "based on our current rates",
    telephone: "Phone / WhatsApp",
    email: "E-mail",
    nonRenseigne: "Not provided",
    votreMessage: "Your message",
    pasReservation:
      "This is a request, not yet a booking. Your dates are not blocked until we confirm availability.",
    annulation:
      "If your request is accepted, we will send you a confirmation and payment instructions. Full payment is required within 72 hours of acceptance to finalize your booking.Cancellation policy: 100% refund for cancellations made 15 days or more before arrival; 50% refund for cancellations made 8–14 days before arrival; no refund for cancellations made 7 days or less before arrival.",
    correction:
      "If any information is incorrect, or you would like to clarify anything, simply reply to this email.",
    signature: "See you soon,\nThe Casa Noppalu team",
},

  es: {
    sujet: "Casa Noppalu - Hemos recibido su solicitud",
    bonjour: (nom) => `Hola ${nom},`,
    intro:
      "Gracias por su solicitud. La hemos recibido correctamente y le responderemos lo antes posible.",
    titre: "Resumen de su solicitud",
    studio: "Estudio",
    arrivee: "Llegada",
    depart: "Salida",
    duree: (n) => `${n} noche${n > 1 ? "s" : ""}`,
    voyageurs: "Viajeros",
    estimation: "Estimación de la estancia",
    estimationNote: "según nuestra tarifa actual",
    telephone: "Teléfono / WhatsApp",
    email: "Correo electrónico",
    nonRenseigne: "No especificado",
    votreMessage: "Su mensaje",
    pasReservation:
      "Se trata de una solicitud, no de una reserva: las fechas no están bloqueadas hasta que le confirmemos la disponibilidad.",
    annulation:
      "Si su solicitud es aceptada, le enviaremos una confirmación acompañada de una solicitud de pago en un plazo de 72h para que su reserva sea definitiva. En caso de cancelación: reembolso del 100 % si cancela 15 días o más antes de la llegada, del 50 % entre 14 y 8 días antes, ningún reembolso a 7 días o menos.",
    correction:
      "¿Hay alguna información incorrecta o desea precisar algo? Simplemente responda a este correo electrónico.",
    signature: "Hasta pronto,\nEl equipo de Casa Noppalu",
}
};

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !from || !to) {
    console.error("Réservation : variable d'environnement manquante");
    return erreur("envoi_echoue", 500);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return erreur("requete_invalide", 400);
  }
  if (!body || typeof body !== "object") return erreur("requete_invalide", 400);

  // Anti-spam : champ invisible que seuls les robots remplissent
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const slug = String(body.slug ?? "").trim();
  const arrivee = String(body.arrivee ?? "").trim();
  const depart = String(body.depart ?? "").trim();
  const voyageurs = Number(body.voyageurs);
  const nom = String(body.nom ?? "").trim();
  const email = String(body.email ?? "").trim();
  const telephone = String(body.telephone ?? "").trim();
  const message = String(body.message ?? "").trim();
  const localeBrute = body.locale;
  const locale = hasLocale(routing.locales, localeBrute)
    ? localeBrute
    : routing.defaultLocale;

  if (nom.length < 2 || nom.length > 100) return erreur("nom_invalide", 400);

  const problemeEmail = validerEmail(email);
  if (problemeEmail) return erreur(problemeEmail, 400);

  if (telephone.length > 30) return erreur("telephone_invalide", 400);
  if (message.length > 2000) return erreur("message_trop_long", 400);

  try {
    const studio = await getBungalow(slug);
    if (!studio || !studio.publie) return erreur("studio_inconnu", 400);

    const codeSejour = validerSejour({
      arrivee,
      depart,
      voyageurs,
      capacite: studio.capacite,
    });
    if (codeSejour) return erreur(codeSejour, 400);

    const libres = await getStudiosLibres(arrivee, depart);
    if (!libres.some((s) => s.slug === slug)) {
      return erreur("studio_indisponible", 409);
    }

    // Estimation toujours calculée et enregistrée, même si les prix sont masqués sur le site
    const reglages = await getReglages();
    const total = prixDuSejour(arrivee, depart, reglages.tarifs);

    const admin = createAdminClient();

    // Évite les doublons (double clic, renvoi du formulaire)
    const { data: doublon, error: erreurDoublon } = await admin
      .from("booking_requests")
      .select("id")
      .eq("bungalow_slug", slug)
      .eq("start_date", arrivee)
      .eq("end_date", depart)
      .eq("email", email)
      .eq("status", "nouvelle")
      .limit(1);
    if (erreurDoublon) throw erreurDoublon;
    if (doublon && doublon.length > 0) return NextResponse.json({ ok: true });

    const { data: ligne, error: erreurInsert } = await admin
      .from("booking_requests")
      .insert({
        bungalow_slug: slug,
        start_date: arrivee,
        end_date: depart,
        guests: voyageurs,
        guest_name: nom,
        email,
        phone: telephone || null,
        message: message || null,
        locale,
        estimated_total: total,
      })
      .select("id")
      .single();
    if (erreurInsert) throw erreurInsert;

    const resend = new Resend(apiKey);
    const nuits = nombreNuits(arrivee, depart);

    // 1) E-mail pour toi. Tant que l'admin n'existe pas, un e-mail raté = demande invisible :
    // on annule alors l'enregistrement pour que le visiteur puisse réessayer proprement.
    try {
      const sujet = `Casa Noppalu - Demande de réservation : ${studio.nom}, ${dateLoc(arrivee, "fr")} au ${dateLoc(depart, "fr")} (${nom})`.replace(
        /\s+/g,
        " ",
      );

      const lignes = [
        ["Studio", studio.nom],
        ["Arrivée", dateLoc(arrivee, "fr")],
        ["Départ", dateLoc(depart, "fr")],
        ["Durée", `${nuits} nuit${nuits > 1 ? "s" : ""}`],
        ["Voyageurs", String(voyageurs)],
        ["Estimation", `${montantLoc(total, "fr")} FCFA (grille tarifaire actuelle)`],
        ["Nom", nom],
        ["E-mail", email],
        ["Téléphone / WhatsApp", telephone || "Non renseigné"],
        ["Langue", locale],
      ];

      const { error: erreurEmail } = await resend.emails.send({
        from,
        to,
        replyTo: email,
        subject: sujet,
        text:
          lignes.map(([k, v]) => `${k} : ${v}`).join("\n") +
          `\n\nMessage :\n${message || "(aucun)"}\n\nCeci est une demande, pas une réservation : les dates ne sont pas bloquées.`,
        html:
          lignes
            .map(
              ([k, v]) =>
                `<p><strong>${escapeHtml(k)} :</strong> ${escapeHtml(v)}</p>`,
            )
            .join("") +
          `<p><strong>Message :</strong></p><p style="white-space:pre-wrap">${escapeHtml(message || "(aucun)")}</p>` +
          `<p><em>Ceci est une demande, pas une réservation : les dates ne sont pas bloquées.</em></p>`,
      });
      if (erreurEmail) throw erreurEmail;
    } catch (e) {
      console.error("Réservation : échec d'envoi de l'e-mail", e);
      await admin.from("booking_requests").delete().eq("id", ligne.id);
      return erreur("envoi_echoue", 500);
    }

    // 2) Confirmation pour le visiteur. N'annule rien si elle échoue :
    // ta demande est déjà enregistrée et tu l'as reçue.
    try {
      const x = TEXTES_CONFIRMATION[locale] ?? TEXTES_CONFIRMATION.fr;

      const recap: [string, string][] = [
        [x.studio, studio.nom],
        [x.arrivee, dateLoc(arrivee, locale)],
        [x.depart, dateLoc(depart, locale)],
        ["", x.duree(nuits)],
        [x.voyageurs, String(voyageurs)],
      ];
      // L'estimation n'est montrée que si les prix sont affichés sur le site
      if (reglages.afficherPrix) {
        recap.push([
          x.estimation,
          `${montantLoc(total, locale)} FCFA (${x.estimationNote})`,
        ]);
      }
      recap.push([x.telephone, telephone || x.nonRenseigne]);
      recap.push([x.email, email]);

      const ligneTexte = ([k, v]: [string, string]) => (k ? `${k} : ${v}` : v);

      const { error: erreurConfirmation } = await resend.emails.send({
        from,
        to: email,
        replyTo: to,
        subject: x.sujet,
        text: [
          x.bonjour(nom),
          "",
          x.intro,
          "",
          x.titre,
          ...recap.map(ligneTexte),
          ...(message ? ["", `${x.votreMessage} :`, message] : []),
          "",
          x.pasReservation,
          "",
          x.annulation,
          "",
          x.correction,
          "",
          x.signature,
        ].join("\n"),
        html:
          `<p>${escapeHtml(x.bonjour(nom))}</p>` +
          `<p>${escapeHtml(x.intro)}</p>` +
          `<p><strong>${escapeHtml(x.titre)}</strong></p>` +
          recap
            .map(([k, v]) =>
              k
                ? `<p style="margin:2px 0">${escapeHtml(k)} : <strong>${escapeHtml(v)}</strong></p>`
                : `<p style="margin:2px 0"><strong>${escapeHtml(v)}</strong></p>`,
            )
            .join("") +
          (message
            ? `<p><strong>${escapeHtml(x.votreMessage)} :</strong></p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`
            : "") +
          `<p><em>${escapeHtml(x.pasReservation)}</em></p>` +
          `<p>${escapeHtml(x.annulation)}</p>` +
          `<p>${escapeHtml(x.correction)}</p>` +
          `<p style="white-space:pre-line">${escapeHtml(x.signature)}</p>`,
      });
      if (erreurConfirmation) throw erreurConfirmation;
    } catch (e) {
      console.error("Réservation : échec de l'e-mail de confirmation", e);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Réservation : échec", e);
    return erreur("envoi_echoue", 500);
  }
}