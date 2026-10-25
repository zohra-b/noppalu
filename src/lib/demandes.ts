import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  aDelaiPaiement,
  type MoyenPaiement,
  type OrigineDemande,
} from "@/lib/reservations-types";

export { LIBELLES_SOURCE } from "@/lib/blocages-types";

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
  voyageurs: number | null;
  nom: string | null;
  email: string | null;
  telephone: string | null;
  message: string | null;
  langue: string;
  estimation: number | null; // en FCFA (montant de la réservation)
  statut: StatutDemande;
  origine: OrigineDemande;
  moyenPaiement: MoyenPaiement | null;
  accepteeLe: string | null;
  payeeLe: string | null;
  confirmationEnvoyeeLe: string | null;
  rappelEnvoyeLe: string | null;
};

type Ligne = {
  id: string;
  created_at: string;
  bungalow_slug: string;
  start_date: string;
  end_date: string;
  guests: number | null;
  guest_name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  locale: string;
  estimated_total: number | null;
  status: StatutDemande;
  origin: OrigineDemande;
  payment_method: MoyenPaiement | null;
  accepted_at: string | null;
  paid_at: string | null;
  confirmation_sent_at: string | null;
  reminder_sent_at: string | null;
};

const COLONNES =
  "id, created_at, bungalow_slug, start_date, end_date, guests, guest_name, email, phone, message, locale, estimated_total, status, origin, payment_method, accepted_at, paid_at, confirmation_sent_at, reminder_sent_at";

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
    origine: l.origin,
    moyenPaiement: l.payment_method,
    accepteeLe: l.accepted_at,
    payeeLe: l.paid_at,
    confirmationEnvoyeeLe: l.confirmation_sent_at,
    rappelEnvoyeLe: l.reminder_sent_at,
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

// --- Délai de paiement (demandes du site et réservations directes) ---

export const DELAI_PAIEMENT_HEURES = 72;

/** Heure limite de paiement d'une réservation acceptée, ou null si aucun délai ne s'applique. */
export function echeancePaiement(d: Demande): Date | null {
  if (d.statut !== "acceptee" && d.statut !== "en_attente_paiement") return null;
  if (!aDelaiPaiement(d.origine)) return null;
  if (!d.accepteeLe) return null;
  return new Date(
    new Date(d.accepteeLe).getTime() + DELAI_PAIEMENT_HEURES * 3_600_000,
  );
}

/** Vrai si une réservation acceptée n'a pas été payée dans le délai. */
export function delaiDepasse(d: Demande): boolean {
  const echeance = echeancePaiement(d);
  return echeance !== null && echeance.getTime() < Date.now();
}

// --- Présentation ---

export const LIBELLES_STATUT: Record<StatutDemande, string> = {
  nouvelle: "Nouvelle",
  acceptee: "À encaisser",
  en_attente_paiement: "À encaisser",
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

const formatDate = new Intl.DateTimeFormat("fr", {
  dateStyle: "long",
  timeZone: "UTC",
});
const formatDateCourte = new Intl.DateTimeFormat("fr", {
  dateStyle: "medium",
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

/** « 2026-12-05 » devient « 5 déc. 2026 ». */
export function formaterDateCourte(cle: string): string {
  const [a, m, j] = cle.split("-").map(Number);
  return formatDateCourte.format(new Date(Date.UTC(a, m - 1, j)));
}

export function formaterDateHeure(iso: string): string {
  return formatDateHeure.format(new Date(iso));
}

export function pluriel(n: number, mot: string): string {
  return `${n} ${mot}${n > 1 ? "s" : ""}`;
}