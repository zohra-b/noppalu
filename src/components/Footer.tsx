import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="w-full bg-green text-sand">
      {/* Première ligne : trois blocs */}
      <div className="grid w-full grid-cols-1 items-center gap-4 px-6 py-5 sm:grid-cols-3">

        {/* Bloc gauche : identité */}
        <div className="flex justify-center sm:justify-start">
          <Link
            href="/"
            className="font-serif text-lg font-semibold hover:text-linen"
          >
            Casa Noppalu
          </Link>
        </div>

        {/* Bloc central : réseaux sociaux */}
        <div className="flex items-center justify-center gap-5">
          <a
            href="https://www.facebook.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook Casa Noppalu"
            className="transition-colors hover:text-linen"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M13.5 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.6 1.6-1.6h1.7V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.3v3.2h2.8V21h3.4Z" />
            </svg>
          </a>

          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram Casa Noppalu"
            className="transition-colors hover:text-linen"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>

        {/* Bloc droit : navigation */}
        <nav className="flex items-center justify-center gap-6 text-sm sm:justify-end">
          <Link href="/#bungalows" className="hover:text-linen">
            {t("bungalows")}
          </Link>
          <Link href="/contact" className="hover:text-linen">
            {t("contact")}
          </Link>
        </nav>
      </div>

      {/* Deuxième ligne : droits réservés */}
      <div className="border-t border-sand/40 px-6 py-3 text-center text-xs">
        {t("droits", { annee: String(new Date().getFullYear()) })}
      </div>
    </footer>
  );
}

