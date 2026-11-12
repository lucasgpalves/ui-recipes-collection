/** Categorias comuns da navegação pública (estrutura do design). */
export const COMMON_CATEGORIES = [
  'Bolos',
  'Carnes',
  'Doces',
  'Massas',
  'Sobremesa',
  'Sopas',
  'Frutos do mar',
  'Japonesa',
  'Italiana',
] as const

export function resolveNavCategories(apiNames: string[]): string[] {
  const cleaned = apiNames.map((name) => name.trim()).filter(Boolean)
  return cleaned.length > 0 ? cleaned : [...COMMON_CATEGORIES]
}
