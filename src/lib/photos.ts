const PHOTOS: Record<string, string[]> = {

  manguier: ["/images/manguier.jpg", "/images/manguier/manguier-vue-ensemble.jpg", "/images/manguier/manguier-lit.jpg", "/images/manguier/manguier-repas.jpg", "/images/manguier/manguier-douche.jpg", "/images/manguier/manguier-kitchenette.jpg", "/images/manguier/manguier-portefenetre.jpg"],

  cocotier: ["/images/cocotier.jpeg" , "/images/cocotier/cocotier-vue-ensemble.jpg", "/images/cocotier/cocotier-lit.jpg", "/images/cocotier/cocotier-repas.jpg", "/images/cocotier/cocotier-douche.jpg", "/images/cocotier/cocotier-kitchenette.jpg", "/images/cocotier/cocotier-vue-jardin.jpg"],
  
  bananier: ["/images/bananier.jpg" , "/images/bananier/bananier-vue-ensemble.jpg", "/images/bananier/bananier-lit.jpg", "/images/bananier/bananier-repas.jpg", "/images/bananier/bananier-douche.jpg", "/images/bananier/bananier-kitchenette.jpg", "/images/bananier/bananier-vue-jardin.jpg"],
};

export function photosDe(slug: string): string[] {
  return PHOTOS[slug] ?? [];
}