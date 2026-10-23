import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type CoordonneesPaiement = {
  wave: string | null;
  iban: string | null;
  titulaire: string | null;
  paypal: string | null;
};

const nettoyer = (v: string | null | undefined) =>
  v && v.trim() ? v.trim() : null;

/** Coordonnées de paiement (table privée, lisible uniquement par le code serveur). */
export async function getCoordonneesPaiement(): Promise<CoordonneesPaiement | null> {
  const { data, error } = await createAdminClient()
    .from("payment_details")
    .select("wave_number, iban, iban_holder, paypal_email")
    .maybeSingle();

  if (error) {
    console.error("Admin : lecture des coordonnées de paiement impossible", error);
    return null;
  }
  if (!data) return null;

  return {
    wave: nettoyer(data.wave_number),
    iban: nettoyer(data.iban),
    titulaire: nettoyer(data.iban_holder),
    paypal: nettoyer(data.paypal_email),
  };
}

export function coordonneesIncompletes(c: CoordonneesPaiement | null): boolean {
  return !c || !c.wave || !c.iban || !c.titulaire || !c.paypal;
}