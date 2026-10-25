import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/session";

export default async function CalendrierPage() {
  await requireAdmin();
  redirect("/admin/reservations?vue=calendrier");
}