import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/session";

// Anciens filtres de la liste des demandes -> nouveaux filtres
const CORRESPONDANCE = {
  "a-traiter": "a-traiter",
  acceptees: "a-encaisser",
  terminees: "terminees",
  toutes: "toutes",
} as const;

export default async function DemandesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  await requireAdmin();
  const { statut } = await searchParams;
  const filtre =
    statut && Object.hasOwn(CORRESPONDANCE, statut)
      ? CORRESPONDANCE[statut as keyof typeof CORRESPONDANCE]
      : null;
  redirect(filtre ? `/admin/reservations?filtre=${filtre}` : "/admin/reservations");
}