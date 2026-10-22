import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const traduction = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return rafraichirSessionAdmin(request);
  }
  return traduction(request);
}

// Renouvelle les jetons de connexion expirés et les enregistre dans les cookies.
// Les composants serveur ne peuvent pas écrire de cookies : c'est ce proxy qui le fait.
async function rafraichirSessionAdmin(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (url && cle) {
    try {
      const supabase = createServerClient(url, cle, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      });
      // Vérifie la session auprès de Supabase et la renouvelle si besoin
      await supabase.auth.getUser();
    } catch (e) {
      // La page vérifie de toute façon la session : on la laisse se charger
      console.error("Admin : renouvellement de la session impossible", e);
    }
  }

  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};