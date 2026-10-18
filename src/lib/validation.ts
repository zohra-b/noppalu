const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const FAUTES_COURANTES: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmail.con": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "yaho.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yaho.fr": "yahoo.fr",
  "outlok.com": "outlook.com",
  "outlook.con": "outlook.com",
};

export type CodeErreurEmail = "email_vide" | "email_trop_long" | "email_invalide";

// Renvoie un code d'erreur, ou null si l'adresse est valide.
export function validerEmail(brut: string): CodeErreurEmail | null {
  const email = brut.trim();
  if (!email) return "email_vide";
  if (email.length > 200) return "email_trop_long";
  if (!EMAIL_RE.test(email) || email.includes("..")) return "email_invalide";
  return null;
}

// Renvoie l'adresse corrigée si le domaine ressemble à une faute de frappe.
export function suggererEmail(brut: string): string | null {
  const email = brut.trim();
  const [local, domaine] = email.split("@");
  const corrige = domaine && FAUTES_COURANTES[domaine.toLowerCase()];
  return corrige ? `${local}@${corrige}` : null;
}