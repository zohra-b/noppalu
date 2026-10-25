import "server-only";
import { Resend } from "resend";
import { formaterDateCourte, pluriel, type Demande } from "@/lib/demandes";
import { formaterMontantDouble } from "@/lib/monnaie";
import { LIBELLES_ORIGINE } from "@/lib/reservations-types";
import { nombreNuits } from "@/lib/sejour";

const SITE = "https://www.casanoppalu.com";
const JOURS = ["Aujourd'hui", "Demain", "Après-demain"];

const echapper = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Envoie le récapitulatif des arrivées proches. Lève une erreur si l'envoi échoue. */
export async function envoyerRappelArrivees(
  demandes: Demande[],
  noms: Map<string, string>,
  aujourdhui: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.REMINDER_TO_EMAIL || process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !from || !to) {
    throw new Error("Variables d'environnement d'e-mail manquantes");
  }

  // Un bloc de lignes par arrivée ; la dernière ligne est l'adresse de la fiche
  const blocs = demandes.map((d) => {
    const delai = nombreNuits(aujourdhui, d.arrivee);
    const quand = JOURS[delai] ?? formaterDateCourte(d.arrivee);
    const studio = noms.get(d.studioSlug) ?? d.studioSlug;

    const lignes = [
      `${quand.toUpperCase()} : ${studio}`,
      `Du ${formaterDateCourte(d.arrivee)} au ${formaterDateCourte(d.depart)} (${pluriel(nombreNuits(d.arrivee, d.depart), "nuit")})`,
      [
        d.nom ?? "Client sans nom",
        d.voyageurs ? pluriel(d.voyageurs, "voyageur") : null,
        LIBELLES_ORIGINE[d.origine],
      ]
        .filter(Boolean)
        .join(" · "),
    ];

    const contact = [d.telephone, d.email].filter(Boolean).join(" · ");
    if (contact) lignes.push(contact);

    if (d.statut !== "payee") {
      lignes.push(
        `À encaisser${d.estimation !== null ? ` : ${formaterMontantDouble(d.estimation)}` : ""}`,
      );
    }
    lignes.push(`${SITE}/admin/demandes/${d.id}`);
    return lignes;
  });

  const sujet = `Casa Noppalu - Rappel : ${pluriel(demandes.length, "arrivée")} dans les 48 h`;
  const intro = "Arrivées dans les prochaines 48 h :";

  const texte = [intro, "", ...blocs.map((l) => l.join("\n")).flatMap((b) => [b, ""])]
    .join("\n")
    .trimEnd();

  const html =
    `<p>${echapper(intro)}</p>` +
    blocs
      .map((l) => {
        const url = l[l.length - 1];
        const milieu = l.slice(1, -1).map(echapper).join("<br>");
        return `<p style="margin:0 0 16px"><strong>${echapper(l[0])}</strong><br>${milieu}<br><a href="${url}">Ouvrir la fiche</a></p>`;
      })
      .join("");

  const { error } = await new Resend(apiKey).emails.send({
    from,
    to,
    subject: sujet,
    text: texte,
    html,
  });
  if (error) throw error;
}