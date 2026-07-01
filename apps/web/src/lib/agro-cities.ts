export interface AgroCity {
  slug: string;
  name: string;
  uf: string;
  destaque: string; // cultura/atividade de destaque
}

// Principais polos do agronegócio brasileiro (SEO programático)
export const AGRO_CITIES: AgroCity[] = [
  { slug: 'sorriso-mt', name: 'Sorriso', uf: 'MT', destaque: 'soja e milho' },
  { slug: 'rio-verde-go', name: 'Rio Verde', uf: 'GO', destaque: 'grãos e suinocultura' },
  { slug: 'sao-desiderio-ba', name: 'São Desidério', uf: 'BA', destaque: 'soja e algodão' },
  { slug: 'sapezal-mt', name: 'Sapezal', uf: 'MT', destaque: 'algodão e soja' },
  { slug: 'primavera-do-leste-mt', name: 'Primavera do Leste', uf: 'MT', destaque: 'soja e milho' },
  { slug: 'luis-eduardo-magalhaes-ba', name: 'Luís Eduardo Magalhães', uf: 'BA', destaque: 'grãos e algodão' },
  { slug: 'cascavel-pr', name: 'Cascavel', uf: 'PR', destaque: 'grãos e aves' },
  { slug: 'uberaba-mg', name: 'Uberaba', uf: 'MG', destaque: 'cana, grãos e pecuária' },
  { slug: 'dourados-ms', name: 'Dourados', uf: 'MS', destaque: 'soja e milho' },
  { slug: 'barreiras-ba', name: 'Barreiras', uf: 'BA', destaque: 'soja e algodão' },
  { slug: 'cristalina-go', name: 'Cristalina', uf: 'GO', destaque: 'grãos irrigados' },
  { slug: 'campo-novo-do-parecis-mt', name: 'Campo Novo do Parecis', uf: 'MT', destaque: 'algodão e grãos' },
];

export function getCity(slug: string) {
  return AGRO_CITIES.find((c) => c.slug === slug) ?? null;
}
