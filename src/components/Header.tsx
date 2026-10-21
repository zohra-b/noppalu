"use client"; 

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const langues = [ 
    { code: "fr", nom: "Français", drapeau: "🇫🇷" }, 
    { code: "en", nom: "English", drapeau: "🇬🇧" }, 
    { code: "es", nom: "Español", drapeau: "🇪🇸" }, ];
    

type StudioMenu = { slug: string; nom: string };

export default function Header({ bungalows }: { bungalows: StudioMenu[] }) {
    const bungalowsPublies = bungalows;
    const t = useTranslations("Header");
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();

    const [menuLanguesOuvert, setMenuLanguesOuvert] = useState(false); 
    const [menuBungalowsOuvert, setMenuBungalowsOuvert] = useState(false);

    const languesActives = langues.filter((l) =>
        (routing.locales as readonly string[]).includes(l.code),
        );
    const plusieursLangues = languesActives.length > 1;
    const langueSelectionnee =
    languesActives.find((l) => l.code === locale) ?? languesActives[0];


         
    return (
       <header className="w-full bg-linen px-4 py-2 sm:px-6">
            {/* Partie gauche : logo et identité */}
            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                     <Image
                        src = "/images/logo-rond.png"
                        alt = {t("logoAlt")}
                        width={128}
                        height={128}
                        className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16 lg:h-20 lg:w-20 "
                    />
                    <div>
                    <p className="text-xl sm:text-2xl font-serif font-semibold text-green">
                        Casa Noppalu
                        </p>
                    <p className="font-serif text-base italic text-sand">
                        {t("slogan")}
                        </p>
                        </div>
                </div>
                    </Link>

            {/* Partie droite : nav et langues*/}
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-6">
                <Link 
                    href="/"
                    className="text-green hover:text-sand">
                         {t("accueil")}
                </Link>

                {bungalowsPublies.length === 0 ? (
                    <Link href="/bungalows" className="text-green hover:text-sand">
                        {t("bungalows")}
                    </Link>
                    ) : (
                        <div
                            className="relative"
                            onMouseEnter={() => setMenuBungalowsOuvert(true)}
                            onMouseLeave={() => setMenuBungalowsOuvert(false)}
                        >
                        
                        <Link href="/bungalows" className="text-green hover:text-sand">
                        {t("bungalows")}
                        </Link>

                        {menuBungalowsOuvert && (
                            <div className="absolute left-0 top-full z-50 min-w-44 rounded-md bg-white py-2 shadow-lg">
                                <Link
                                href="/bungalows"
                                onClick={() => setMenuBungalowsOuvert(false)}
                                className="block px-4 py-2 text-green hover:bg-linen"
                                >
                                {t("presentation")}
                                </Link>
                                {bungalowsPublies.map((b) => (
                                <Link
                                    key={b.slug}
                                    href={`/bungalows/${b.slug}`}
                                    onClick={() => setMenuBungalowsOuvert(false)}
                                    className="block px-4 py-2 text-green hover:bg-linen"
                                >
                                    {b.nom}
                                </Link>
                                ))}
                            </div>
                        )}
                        </div>
)}
                

                <Link 
                    href="/contact"
                    className="text-green hover:text-sand"> 
                    {t("contact")} 
                </Link>

                {bungalowsPublies.length > 0 && (
            <Link
              href="/reservation"
              className="rounded-md bg-green px-4 py-1.5 text-sm font-medium text-linen transition-colors hover:bg-[#244D2B]"
            >
              {t("reserver")}
            </Link>
          )}

                {/* Sélecteur de langue */}
                {plusieursLangues && (
                <div 
                className="relative"
                onMouseEnter={() => setMenuLanguesOuvert(true)}
                onMouseLeave={() => setMenuLanguesOuvert(false)}> 
                    <button
                        type="button"
                        aria-label={t("langueActuelle",{ langue: langueSelectionnee.nom})}
                        aria-expanded={menuLanguesOuvert}
                        className="rounded-md p-2 hover:bg-white/50"
                        >
                        <span className="text-2xl">
                        {langueSelectionnee.drapeau}
                        </span>
                    </button>

                    {menuLanguesOuvert && ( 
                        <div className="absolute right-0 top-full z-50 min-w-36 rounded-md bg-white py-2 shadow-lg"> 
                        {languesActives 
                            .filter((l) => l.code !== locale) 
                            .map((l) => ( 
                                <button 
                                    key={l.code} 
                                    type="button" 
                                    onClick={() => {
                                        router.replace(pathname, {
                                        locale: l.code as (typeof routing.locales)[number],
                                        });
                                        setMenuLanguesOuvert(false); }} 
                                    className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-linen" 
                                    > 
                                <span className="text-xl"> 
                                    {l.drapeau} 
                                    </span> 
                                <span className="text-sm text-foreground"> 
                                    {l.nom} 
                                    </span> 
                                </button> 
                            ))} 
                            </div> 
                        )} 
                    </div>
                )}
            </nav>



            </div>
            <div className="mx-auto mt-2 h-px w-[98%] bg-sand shadow-[0_2px_3px_rgba(34,34,34,0.18)]" />
        </header>
    )
    
}