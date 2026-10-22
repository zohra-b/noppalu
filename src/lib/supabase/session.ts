import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase lié à la session de l'utilisateur connecté (cookies).
 * Il utilise la clé publishable : il ne contourne PAS la sécurité.
 */
export async function createSessionClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !cle) throw new Error("Configuration Supabase incomplète.");

  const cookieStore = await cookies();

  return createServerClient(url, cle, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Appelé depuis un composant serveur, qui ne peut pas écrire de cookies :
          // le proxy (étape B3) renouvellera la session.
        }
      },
    },
  });
}

/**
 * Renvoie l'administrateur connecté, ou null.
 * getUser() interroge le serveur d'authentification (on ne fait pas confiance au cookie seul),
 * et on vérifie en plus que c'est bien le compte administrateur.
 */
export async function getAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return null;

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  if (data.user.email?.toLowerCase() !== adminEmail) return null;
  return data.user;
}