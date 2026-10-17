import type { MetadataRoute } from "next";

// Indique aux robots ce qu’ils peuvent explorer.
//Ton fichier dit : « tout le site est autorisé, sauf /api/ ». La route /api/contact n’a aucun intérêt à être explorée.
//GITIl indique aussi l’adresse du sitemap, ce qui évite de devoir le chercher.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: "https://www.casanoppalu.com/sitemap.xml",
  };
}