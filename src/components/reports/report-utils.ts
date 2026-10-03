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
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompactRupiah(value: number) {
  const absoluteValue = Math.abs(value)

  const sign = value < 0 ? '-' : ''

  if (absoluteValue >= 1_000_000_000) {
    return `${sign}Rp${new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 1,
    }).format(absoluteValue / 1_000_000_000)} M`
  }

  if (absoluteValue >= 1_000_000) {
    return `${sign}Rp${new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 1,
    }).format(absoluteValue / 1_000_000)} jt`
  }

  if (absoluteValue >= 1_000) {
    return `${sign}Rp${new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 1,
    }).format(absoluteValue / 1_000)} rb`
  }

  return `${sign}Rp${new Intl.NumberFormat('id-ID').format(absoluteValue)}`
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
