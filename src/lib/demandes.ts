import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type StatutDemande =
  | "nouvelle"
  | "acceptee"
  | "en_attente_paiement"
  | "payee"
  | "refusee"
  | "expiree";

export type Demande = {
  id: string;
  creeeLe: string;
  studioSlug: string;
  arrivee: string; // première nuit
  depart: string; // jour du départ (exclusif)
  voyageurs: number;
  nom: string;
  email: string;
  telephone: string | null;
  message: string | null;
  langue: string;
  estimation: number | null;
  statut: StatutDemande;
};

type Ligne = {
  id: string;
  created_at: string;
  bungalow_slug: string;
  start_date: string;
  end_date: string;
  guests: number;
  guest_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  locale: string;
  estimated_total: number | null;
  status: StatutDemande;
};

const COLONNES =
  "id, created_at, bungalow_slug, start_date, end_date, guests, guest_name, email, phone, message, locale, estimated_total, status";

function versDemande(l: Ligne): Demande {
  return {
    id: l.id,
    creeeLe: l.created_at,
    studioSlug: l.bungalow_slug,
    arrivee: l.start_date,
    depart: l.end_date,
    voyageurs: l.guests,
    nom: l.guest_name,
    email: l.email,
    telephone: l.phone,
    message: l.message,
    langue: l.locale,
    estimation: l.estimated_total,
    statut: l.status,
  };
}

/** Les 200 demandes les plus récentes. */
export async function getDemandes(): Promise<Demande[]> {
  const { data, error } = await createAdminClient()
    .from("booking_requests")
    .select(COLONNES)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(`Lecture des demandes impossible : ${error.message}`);
  return (data as Ligne[]).map(versDemande);
}

export async function getDemande(id: string): Promise<Demande | null> {
  const { data, error } = await createAdminClient()
    .from("booking_requests")
    .select(COLONNES)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Lecture de la demande impossible : ${error.message}`);
  return data ? versDemande(data as Ligne) : null;
}

export type Conflit = {
  debut: string;
  fin: string;
  source: string;
  nom: string | null;
};

/** Périodes déjà bloquées qui chevauchent un séjour (un départ le jour de l'arrivée ne gêne pas). */
export async function getConflits(
  slug: string,
  arrivee: string,
  depart: string,
): Promise<Conflit[]> {
  const { data, error } = await createAdminClient()
    .from("availability_blocks")
    .select("start_date, end_date, source, guest_name")
    .eq("bungalow_slug", slug)
    .lt("start_date", depart)
    .gt("end_date", arrivee)
    .order("start_date", { ascending: true });
  if (error) throw new Error(`Lecture des blocages impossible : ${error.message}`);
  return (
    data as {
      start_date: string;
      end_date: string;
      source: string;
      guest_name: string | null;
    }[]
  ).map((l) => ({
    debut: l.start_date,
    fin: l.end_date,
    source: l.source,
    nom: l.guest_name,
  }));
}

// --- Présentation ---

export const LIBELLES_STATUT: Record<StatutDemande, string> = {
  nouvelle: "Nouvelle",
  acceptee: "Acceptée",
  en_attente_paiement: "Acceptée",
  payee: "Payée",
  refusee: "Refusée",
  expiree: "Annulée",
};

export const CLASSES_STATUT: Record<StatutDemande, string> = {
  nouvelle: "bg-[#C6B06B]/40 text-[#222222]",
  acceptee: "bg-[#2F6036]/15 text-[#2F6036]",
  en_attente_paiement: "bg-[#2F6036]/15 text-[#2F6036]",
  payee: "bg-[#2F6036] text-white",
  refusee: "bg-[#8B3017]/15 text-[#8B3017]",
  expiree: "bg-gray-200 text-gray-600",
};

export const LIBELLES_SOURCE: Record<string, string> = {
  manuel: "Blocage manuel",
  indisponible: "Indisponible",
  airbnb: "Airbnb",
  booking: "Booking.com",
  demande_site: "Demande acceptée du site",
};

const formatDate = new Intl.DateTimeFormat("fr", {
  dateStyle: "long",
  timeZone: "UTC",
});
const formatDateHeure = new Intl.DateTimeFormat("fr", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Dakar", // heure du Sénégal, comme les dates de séjour
});

/** « 2026-12-05 » devient « 5 décembre 2026 ». */
export function formaterDate(cle: string): string {
  const [a, m, j] = cle.split("-").map(Number);
  return formatDate.format(new Date(Date.UTC(a, m - 1, j)));
}

export function formaterDateHeure(iso: string): string {
  return formatDateHeure.format(new Date(iso));
}

export function formaterMontant(n: number): string {
  return `${new Intl.NumberFormat("fr").format(n)} FCFA`;
}

export function pluriel(n: number, mot: string): string {
  return `${n} ${mot}${n > 1 ? "s" : ""}`;
}