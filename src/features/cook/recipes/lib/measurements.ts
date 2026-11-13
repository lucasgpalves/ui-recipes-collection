/** Unidades canônicas usadas no formulário de receita (modo demo / BR). */
export const MEASUREMENT_OPTIONS = [
  { value: 'g', label: 'g (gramas)' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'L', label: 'L (litros)' },
  { value: 'xícara', label: 'xícara' },
  { value: 'colher de sopa', label: 'colher de sopa' },
  { value: 'colher de chá', label: 'colher de chá' },
  { value: 'unidade', label: 'unidade' },
  { value: 'lata', label: 'lata' },
  { value: 'folha', label: 'folha' },
  { value: 'ramo', label: 'ramo' },
  { value: 'pitada', label: 'pitada' },
  { value: 'a gosto', label: 'a gosto' },
] as const

export type MeasurementValue = (typeof MEASUREMENT_OPTIONS)[number]['value']

export const DEFAULT_MEASUREMENT: MeasurementValue = 'g'

const ALIASES: Record<string, MeasurementValue> = {
  g: 'g',
  grama: 'g',
  gramas: 'g',
  'grama de': 'g',
  'gramas de': 'g',
  kg: 'kg',
  'kg de': 'kg',
  quilo: 'kg',
  quilos: 'kg',
  ml: 'ml',
  'ml de': 'ml',
  l: 'L',
  litro: 'L',
  litros: 'L',
  'litro de': 'L',
  'litros de': 'L',
  xícara: 'xícara',
  xicaras: 'xícara',
  xícaras: 'xícara',
  'xícara de': 'xícara',
  'xícaras de': 'xícara',
  'colher de sopa': 'colher de sopa',
  'colheres de sopa': 'colher de sopa',
  'colher de sopa de': 'colher de sopa',
  'colheres de sopa de': 'colher de sopa',
  'colher de chá': 'colher de chá',
  'colheres de chá': 'colher de chá',
  'colher de chá de': 'colher de chá',
  'colheres de chá de': 'colher de chá',
  unidade: 'unidade',
  unidades: 'unidade',
  'unidade de': 'unidade',
  'unidades de': 'unidade',
  lata: 'lata',
  latas: 'lata',
  'lata de': 'lata',
  'latas de': 'lata',
  folha: 'folha',
  folhas: 'folha',
  'folha de': 'folha',
  'folhas de': 'folha',
  ramo: 'ramo',
  ramos: 'ramo',
  'ramo de': 'ramo',
  'ramos de': 'ramo',
  pitada: 'pitada',
  pitadas: 'pitada',
  'pitada de': 'pitada',
  'a gosto': 'a gosto',
  'medida de': 'unidade',
  'medidas de': 'unidade',
  'taça de': 'xícara',
  taça: 'xícara',
}

export function normalizeMeasurement(raw: string | null | undefined): MeasurementValue {
  const key = (raw ?? '').trim().toLowerCase()
  if (!key) return DEFAULT_MEASUREMENT
  if (ALIASES[key]) return ALIASES[key]
  const match = MEASUREMENT_OPTIONS.find((item) => item.value.toLowerCase() === key)
  return match?.value ?? DEFAULT_MEASUREMENT
}

function pluralizeUnit(unit: MeasurementValue, amount: number): string {
  if (unit === 'a gosto' || unit === 'g' || unit === 'kg' || unit === 'ml' || unit === 'L') {
    return unit
  }
  if (amount === 1) return unit
  if (unit === 'xícara') return 'xícaras'
  if (unit === 'colher de sopa') return 'colheres de sopa'
  if (unit === 'colher de chá') return 'colheres de chá'
  if (unit === 'unidade') return 'unidades'
  if (unit === 'lata') return 'latas'
  if (unit === 'folha') return 'folhas'
  if (unit === 'ramo') return 'ramos'
  if (unit === 'pitada') return 'pitadas'
  return unit
}

export function formatIngredientLine(
  amount: number,
  measurementName: string,
  ingredientName: string,
): string {
  const unit = normalizeMeasurement(measurementName)
  const name = ingredientName.trim()
  if (unit === 'a gosto') {
    return name ? `${name} a gosto` : 'a gosto'
  }
  const qty = Number.isInteger(amount) ? String(amount) : String(amount).replace('.', ',')
  const unitLabel = pluralizeUnit(unit, amount)
  return `${qty} ${unitLabel} de ${name}`
}
