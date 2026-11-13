/** Mantém apenas dígitos do CPF (até 11). */
export function digitsOnlyCpf(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11)
}

/** Máscara visual `000.000.000-00`. */
export function formatCpf(value: string): string {
  const digits = digitsOnlyCpf(value)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function isCompleteCpf(value: string): boolean {
  return digitsOnlyCpf(value).length === 11
}

function checkDigit(digits: string, factor: number): number {
  let sum = 0
  for (let i = 0; i < factor - 1; i += 1) {
    sum += Number(digits[i]) * (factor - i)
  }
  const remainder = (sum * 10) % 11
  return remainder === 10 ? 0 : remainder
}

/** Valida CPF completo (11 dígitos + dígitos verificadores; rejeita sequências iguais). */
export function isValidCpf(value: string): boolean {
  const digits = digitsOnlyCpf(value)
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false
  if (checkDigit(digits, 10) !== Number(digits[9])) return false
  if (checkDigit(digits, 11) !== Number(digits[10])) return false
  return true
}
