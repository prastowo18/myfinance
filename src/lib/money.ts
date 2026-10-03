export function moneyToCents(value: number) {
  const cents = Math.round(value * 100)

  return Object.is(cents, -0) ? 0 : cents
}

export function roundMoney(value: number) {
  return moneyToCents(value) / 100
}

export function formatRupiah(value: number) {
  const cents = moneyToCents(value)
  const normalizedValue = cents / 100
  const hasDecimals = Math.abs(cents % 100) > 0

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(normalizedValue)
}

export function formatPlainRupiah(value: number) {
  const cents = moneyToCents(value)
  const normalizedValue = cents / 100
  const hasDecimals = Math.abs(cents % 100) > 0

  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(normalizedValue)
}
