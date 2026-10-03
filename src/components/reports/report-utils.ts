function moneyToCents(value: number) {
  const cents = Math.round(value * 100)

  return Object.is(cents, -0) ? 0 : cents
}

export function getCurrentMonth() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find((part) => part.type === 'year')?.value ?? ''

  const month = parts.find((part) => part.type === 'month')?.value ?? ''

  return `${year}-${month}`
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

/*
 * Dipertahankan agar komponen lama yang masih memanggil
 * formatCompactRupiah tidak error.
 *
 * Sekarang sengaja menampilkan nominal penuh.
 */
export function formatCompactRupiah(value: number) {
  return formatRupiah(value)
}

export function formatMonth(value: string) {
  const [year, month] = value.split('-')

  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(Number(year), Number(month) - 1, 1))
}

export function formatShortMonth(value: string) {
  const [year, month] = value.split('-')

  return new Intl.DateTimeFormat('id-ID', {
    month: 'short',
    year: '2-digit',
  }).format(new Date(Number(year), Number(month) - 1, 1))
}

export function formatPercentage(value: number) {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 1,
  }).format(value)
}

export function calculateChange(current: number, previous: number) {
  if (previous === 0) {
    return null
  }

  return ((current - previous) / previous) * 100
}
