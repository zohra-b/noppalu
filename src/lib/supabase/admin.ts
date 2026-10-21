import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase avec la clé secrète : il IGNORE la sécurité (RLS).
 * À n'utiliser que dans du code serveur (routes API, composants serveur),
 * jamais dans un composant "use client". // installé les paquets npm install server-only
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SECRET_KEY;

  if (!url || !cle) {
    throw new Error("Configuration Supabase serveur incomplète.");
  }

  return createClient(url, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}