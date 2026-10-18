import { NextResponse } from "next/server";
import { Resend } from "resend";
import { validerEmail } from "@/lib/validation";

const OBJETS = [
  "Disponibilités",
  "Question sur un bungalow",
  "Informations pratiques",
  "Autre demande",
];

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");


export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !from || !to) {
    console.error("Contact : variable d'environnement manquante");
    return NextResponse.json(
      { error: "L'envoi a échoué. Contactez-nous directement à contact@casanoppalu.com ou par WhatsApp." },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  // Honeypot
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const nom = String(body.nom ?? "").trim();
  const email = String(body.email ?? "").trim();
  const telephone = String(body.telephone ?? "").trim();
  const objetBrut = String(body.objet ?? "").trim();
  const message = String(body.message ?? "").trim();
  const objet = OBJETS.includes(objetBrut) ? objetBrut : "Demande de contact";

  if (nom.length < 2 || nom.length > 100) {
    return NextResponse.json({ error: "Nom invalide." }, { status: 400 });
  }
    const problemeEmail = validerEmail(email);
  if (problemeEmail) {
    return NextResponse.json({ error: problemeEmail }, { status: 400 });
  }
  
  if (telephone.length > 30) {
    return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 400 });
  }
  if (message.length < 10 || message.length > 5000) {
    return NextResponse.json(
      { error: "Le message doit contenir entre 10 et 5000 caractères." },
      { status: 400 }
    );
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `Casa Noppalu - ${objet} (${nom})`,
      text: `Nom : ${nom}\nE-mail : ${email}\nTéléphone / WhatsApp : ${telephone || "Non renseigné"}\nObjet : ${objet}\n\nMessage :\n${message}`,
      html: `
        <p><strong>Nom :</strong> ${escapeHtml(nom)}</p>
        <p><strong>E-mail :</strong> ${escapeHtml(email)}</p>
        <p><strong>Téléphone / WhatsApp :</strong> ${escapeHtml(telephone || "Non renseigné")}</p>
        <p><strong>Objet :</strong> ${escapeHtml(objet)}</p>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    `,
  });

  if (error) throw error;
  } catch (err)  {
    console.error("Contact : échec d'envoi", err);
    return NextResponse.json(
      { error: "L'envoi a échoué. Réessayez ou contactez-nous par WhatsApp." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}