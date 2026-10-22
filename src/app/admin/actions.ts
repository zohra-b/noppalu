"use server";

import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/session";
import {
  empreinteIp,
  enregistrerTentative,
  tropDeTentatives,
} from "@/lib/admin-limite";

export type EtatConnexion = { erreur: string } | null;

const IDENTIFIANT = "admin";

const MESSAGES = {
  incorrect: "Identifiant ou mot de passe incorrect.",
  bloque: "Trop de tentatives. Réessayez dans 15 minutes.",
  technique: "Connexion impossible pour le moment. Réessayez dans un instant.",
} as const;

export async function connexion(
  _etat: EtatConnexion,
  formData: FormData,
): Promise<EtatConnexion> {
  const identifiant = String(formData.get("identifiant") ?? "")
    .trim()
    .toLowerCase();
  const motDePasse = String(formData.get("motdepasse") ?? "");
  const email = process.env.ADMIN_EMAIL?.trim();

  if (!email) {
    console.error("Admin : ADMIN_EMAIL manquante");
    return { erreur: MESSAGES.technique };
  }

  let empreinte: string;
  try {
    empreinte = await empreinteIp();
    if (await tropDeTentatives(empreinte)) return { erreur: MESSAGES.bloque };
  } catch (e) {
    // En cas de doute, on refuse plutôt que de laisser passer sans limite
    console.error("Admin : vérification de la limite impossible", e);
    return { erreur: MESSAGES.technique };
  }

  let reussie = false;
  if (
    identifiant === IDENTIFIANT &&
    motDePasse.length > 0 &&
    motDePasse.length <= 200
  ) {
    try {
      const supabase = await createSessionClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: motDePasse,
      });
      reussie = !error;
    } catch (e) {
      console.error("Admin : échec de la connexion", e);
    }
  }

  try {
    await enregistrerTentative(empreinte, reussie);
  } catch (e) {
    console.error("Admin : enregistrement de la tentative impossible", e);
  }

  if (!reussie) return { erreur: MESSAGES.incorrect };
  redirect("/admin");
}

export async function deconnexion() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/admin");
}