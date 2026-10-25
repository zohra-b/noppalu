import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getBungalows } from "@/lib/data";
import {
  annulerReclamationRappels,
  reclamerRappels,
} from "@/lib/demandes";
import { envoyerRappelArrivees } from "@/lib/emails-rappel";
import { RAPPEL_JOURS } from "@/lib/rappels";
import { ajouterJours, aujourdhuiSenegal } from "@/lib/sejour";

export const dynamic = "force-dynamic";

// Seule la tâche planifiée de Vercel (ou toi, avec la clé) peut déclencher cette route
function autorise(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("Rappels : CRON_SECRET manquante, appel refusé");
    return false;
  }
  const recu = Buffer.from(req.headers.get("authorization") ?? "");
  const attendu = Buffer.from(`Bearer ${secret}`);
  return recu.length === attendu.length && timingSafeEqual(recu, attendu);
}

export async function GET(req: Request) {
  if (!autorise(req)) {
    return NextResponse.json({ error: "non_autorise" }, { status: 401 });
  }

  const aujourdhui = aujourdhuiSenegal();
  const jusqua = ajouterJours(aujourdhui, RAPPEL_JOURS);

  let demandes;
  try {
    demandes = await reclamerRappels(aujourdhui, jusqua);
  } catch (e) {
    console.error("Rappels : lecture impossible", e);
    return NextResponse.json({ error: "lecture_impossible" }, { status: 500 });
  }

  if (demandes.length === 0) return NextResponse.json({ ok: true, rappeles: 0 });

  try {
    const studios = await getBungalows().catch(() => []);
    const noms = new Map(studios.map((s) => [s.slug, s.nom]));
    await envoyerRappelArrivees(demandes, noms, aujourdhui);
  } catch (e) {
    console.error("Rappels : échec de l'envoi", e);
    // L'e-mail n'est pas parti : on remet les rappels à envoyer pour le lendemain
    await annulerReclamationRappels(demandes.map((d) => d.id));
    return NextResponse.json({ error: "envoi_echoue" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, rappeles: demandes.length });
}