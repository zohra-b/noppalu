"use client"; 

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";


const langues = [ 
    { code: "fr", nom: "Français", drapeau: "🇫🇷" }, 
    { code: "en", nom: "English", drapeau: "🇬🇧" }, 
    { code: "es", nom: "Español", drapeau: "🇪🇸" }, ];

export default function Header () {
    const [langueActuelle, setLangueActuelle] = useState("fr"); 
    const [menuLanguesOuvert, setMenuLanguesOuvert] = useState(false); 
    const [menuBungalowsOuvert, setMenuBungalowsOuvert] = useState(false);
    const langueSelectionnee = langues.find( 
                (langue) => langue.code === langueActuelle )!;

    return (
       <header className="w-full bg-linen px-4 py-4 sm:px-6">
            {/* Partie gauche : logo et identité */}
            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                     <Image
                        src = "/images/logo-rond.png"
                        alt = "Logo Casa Noppalu"
                        width={128}
                        height={128}
                        className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24 lg:h-32 lg:w-32 "
                    />
                    <div>
                    <p className="text-2xl sm:text-3xl font-serif font-semibold text-green">
                        Casa Noppalu
                        </p>
                    <p className="font-serif text-lg italic text-sand">
                        Calme & Sérénité
                        </p>
                        </div>
                </div>
                    </Link>

            {/* Partie droite : nav et langues*/}
            <nav className="flex items-center gap-6">
                {/* <Link 
                    href="/bungalows"
                    className="text-green hover:text-sand">Réserver
                </Link> */}

                <div 
                className="relative"
                onMouseEnter={() => setMenuBungalowsOuvert(true)}
                onMouseLeave={() => setMenuBungalowsOuvert(false)}
                > 
                    <button 
                        type="button" 
                        aria-expanded={menuBungalowsOuvert} 
                        className="text-green hover:text-sand" 
                        > Nos bungalows </button> 
                        
                    {menuBungalowsOuvert && ( 
                        <div 
                        className="absolute left-0 top-full z-50 min-w-44 rounded-md bg-white py-2 shadow-lg"> 
                        <Link 
                        href="/bungalows/manguier" 
                        onClick={() => setMenuBungalowsOuvert(false)} className="block px-4 py-2 text-green hover:bg-linen" > Manguier </Link> 
                        <Link 
                        href="/bungalows/cocotier" 
                        onClick={() => setMenuBungalowsOuvert(false)} className="block px-4 py-2 text-green hover:bg-linen" > 
                        Cocotier </Link> 
                        <Link 
                        href="/bungalows/bananier" 
                        onClick={() => setMenuBungalowsOuvert(false)} 
                        className="block px-4 py-2 text-green hover:bg-linen" > 
                        Bananier </Link> 
                        </div>)
                    } 
                </div>

                <Link 
                    href="/contact"
                    className="text-green hover:text-sand">Contact 
                </Link>

                {/* Sélecteur de langue */}
                <div 
                className="relative"
                onMouseEnter={() => setMenuLanguesOuvert(true)}
                onMouseLeave={() => setMenuLanguesOuvert(false)}> 
                    <button
                        type="button"
                        aria-label={`Langue actuelle : ${langueSelectionnee.nom}`}
                        aria-expanded={menuLanguesOuvert}
                        className="rounded-md p-2 hover:bg-white/50"
                        >
                        <span className="text-2xl">
                        {langueSelectionnee.drapeau}
                        </span>
                    </button>

                    {menuLanguesOuvert && ( 
                        <div className="absolute right-0 top-full z-50 min-w-36 rounded-md bg-white py-2 shadow-lg"> 
                        {langues 
                            .filter((langue) => langue.code !== langueActuelle) 
                            .map((langue) => ( 
                                <button 
                                    key={langue.code} 
                                    type="button" 
                                    onClick={() => { 
                                        setLangueActuelle(langue.code); 
                                        setMenuLanguesOuvert(false); }} 
                                    className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-linen" 
                                    > 
                                <span className="text-xl"> 
                                    {langue.drapeau} 
                                    </span> 
                                <span className="text-sm text-foreground"> 
                                    {langue.nom} 
                                    </span> 
                                </button> 
                            ))} 
                            </div> 
                        )} 
                    </div>
            </nav>



            </div>
            <div className="mx-auto mt-4 h-px w-[98%] bg-sand shadow-[0_2px_3px_rgba(34,34,34,0.18)]" />
        </header>
    )
    
}