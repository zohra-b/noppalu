import "server-only";
import type { Blocage, SourceBlocage } from "@/lib/blocages-types";
import { ajouterJours, aujourdhuiSenegal } from "@/lib/sejour";
import { createAdminClient } from "@/lib/supabase/admin";

type Ligne = {
  id: string;
  bungalow_slug: string;
  start_date: string;
  end_date: string;
  source: SourceBlocage;
  guest_name: string | null;
  note: string | null;
  request_id: string | null;
};

/** Blocages terminés depuis moins d'un an, ou en cours, ou à venir. */
export async function getBlocages(): Promise<Blocage[]> {
  const depuis = ajouterJours(aujourdhuiSenegal(), -366);

  const { data, error } = await createAdminClient()
    .from("availability_blocks")
    .select(
      "id, bungalow_slug, start_date, end_date, source, guest_name, note, request_id",
    )
    .gte("end_date", depuis)
    .order("start_date", { ascending: true })
    .limit(1000);

  if (error) {
    throw new Error(`Lecture des blocages impossible : ${error.message}`);
  }

  return (data as Ligne[]).map((l) => ({
    id: l.id,
    studioSlug: l.bungalow_slug,
    debut: l.start_date,
    fin: l.end_date,
    source: l.source,
    nom: l.guest_name,
    note: l.note,
    demandeId: l.request_id,
  }));
}