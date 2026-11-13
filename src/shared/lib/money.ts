const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

/** Converte texto digitado em valor (reais), empurrando dígitos pela esquerda (centavos). */
export function parseMoneyInput(value: string): number {
  const digits = value.replace(/\D/g, '')
  if (!digits) return 0
  return Number(digits) / 100
}

/** Máscara visual `R$ 0,00` no padrão pt-BR. */
export function formatMoney(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return moneyFormatter.format(0)
  }
  return moneyFormatter.format(value)
}
