import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

const FENETRE_MINUTES = 15;
const MAX_ECHECS_PAR_IP = 5;
const MAX_ECHECS_TOTAL = 30;
const CONSERVATION_HEURES = 24;

const ilYa = (ms: number) => new Date(Date.now() - ms).toISOString();

/** Empreinte (non réversible facilement) de l'adresse IP du visiteur. */
export async function empreinteIp(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "inconnue";
  return createHash("sha256").update(ip).digest("hex");
}

/** Vrai si trop d'échecs récents (depuis cette adresse, ou au total). */
export async function tropDeTentatives(empreinte: string): Promise<boolean> {
  const admin = createAdminClient();
  const depuis = ilYa(FENETRE_MINUTES * 60_000);

  const [parIp, total] = await Promise.all([
    admin
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("success", false)
      .eq("ip_hash", empreinte)
      .gte("created_at", depuis),
    admin
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("success", false)
      .gte("created_at", depuis),
  ]);
  if (parIp.error) throw parIp.error;
  if (total.error) throw total.error;

  return (
    (parIp.count ?? 0) >= MAX_ECHECS_PAR_IP ||
    (total.count ?? 0) >= MAX_ECHECS_TOTAL
  );
}

/** Note une tentative. Une réussite efface les échecs précédents de cette adresse. */
export async function enregistrerTentative(
  empreinte: string,
  reussie: boolean,
): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("admin_login_attempts")
    .insert({ ip_hash: empreinte, success: reussie });
  if (error) throw error;

  if (reussie) {
    await admin
      .from("admin_login_attempts")
      .delete()
      .eq("ip_hash", empreinte)
      .eq("success", false);
  }

  // Ménage : on ne garde pas l'historique plus de 24 h
  await admin
    .from("admin_login_attempts")
    .delete()
    .lt("created_at", ilYa(CONSERVATION_HEURES * 3_600_000));
}