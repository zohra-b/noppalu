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

// Renvoie un message d'erreur, ou null si l'adresse est valide.
export function validerEmail(brut: string): string | null {
  const email = brut.trim();
  if (!email) return "Indiquez votre adresse e-mail.";
  if (email.length > 200) return "Cette adresse e-mail est trop longue.";
  if (!EMAIL_RE.test(email) || email.includes("..")) {
    return "Cette adresse e-mail n’est pas valide. Exemple : nom@exemple.com";
  }
  return null;
}

// Renvoie l'adresse corrigée si le domaine ressemble à une faute de frappe.
export function suggererEmail(brut: string): string | null {
  const email = brut.trim();
  const [local, domaine] = email.split("@");
  const corrige = domaine && FAUTES_COURANTES[domaine.toLowerCase()];
  return corrige ? `${local}@${corrige}` : null;
}