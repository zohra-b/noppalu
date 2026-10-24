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
  guest_email: string | null;
  guest_phone: string | null;
  note: string | null;
  request_id: string | null;
};

/** Blocages terminés depuis moins d'un an, ou en cours, ou à venir. */
export async function getBlocages(): Promise<Blocage[]> {
  const depuis = ajouterJours(aujourdhuiSenegal(), -366);

  const { data, error } = await createAdminClient()
    .from("availability_blocks")
    .select(
      "id, bungalow_slug, start_date, end_date, source, guest_name, guest_email, guest_phone, note, request_id",
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
    email: l.guest_email,
    telephone: l.guest_phone,
    note: l.note,
    demandeId: l.request_id,
  }));
}

export type Chevauchement = {
  debut: string;
  fin: string;
  source: SourceBlocage;
  nom: string | null;
};

/** Blocages d'un studio qui chevauchent une période (un départ le jour de l'arrivée ne gêne pas). */
export async function getChevauchements(
  slug: string,
  debut: string,
  fin: string,
  ignorerId?: string,
): Promise<Chevauchement[]> {
  let requete = createAdminClient()
    .from("availability_blocks")
    .select("id, start_date, end_date, source, guest_name")
    .eq("bungalow_slug", slug)
    .lt("start_date", fin)
    .gt("end_date", debut);
  if (ignorerId) requete = requete.neq("id", ignorerId);

  const { data, error } = await requete.order("start_date", { ascending: true });
  if (error) {
    throw new Error(`Lecture des blocages impossible : ${error.message}`);
  }

  return (
    data as {
      start_date: string;
      end_date: string;
      source: SourceBlocage;
      guest_name: string | null;
    }[]
  ).map((l) => ({
    debut: l.start_date,
    fin: l.end_date,
    source: l.source,
    nom: l.guest_name,
  }));
}