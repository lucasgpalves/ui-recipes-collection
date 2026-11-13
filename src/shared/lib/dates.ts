/** Converte `dd/MM/yyyy` ou `yyyy-MM-dd` para valor de `<input type="date">`. */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ''
  const trimmed = value.trim()
  const br = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (br) return `${br[3]}-${br[2]}-${br[1]}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  return ''
}

/** Formata ISO `yyyy-MM-dd` para `dd/MM/yyyy` (formato de resposta da API). */
export function formatBrDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null
  const match = isoDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return isoDate.trim()
  return `${match[3]}/${match[2]}/${match[1]}`
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  return !Number.isNaN(date.getTime())
}
