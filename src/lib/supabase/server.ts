import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase pour LIRE les données publiques côté serveur
 * (bungalows publiés, réglages, disponibilités).
 *
 * Il utilise la clé publishable : il ne voit que ce que la RLS autorise
 * au public. Aucune session n'est conservée.
 *
 * Les écritures (admin, demandes de réservation) auront leurs propres
 * clients, créés plus tard.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Variables Supabase manquantes : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}