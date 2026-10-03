import { useEffect, useState } from 'react'

import { Input } from '#/components/ui/input'

type MoneyInputProps = {
  id?: string
  value: number
  onChange: (value: number) => void
  onBlur?: () => void
  allowNegative?: boolean
  placeholder?: string
  className?: string
  invalid?: boolean
  disabled?: boolean
}

function formatMoney(value: number) {
  if (value === 0) {
    return ''
  }

  const rounded = Math.round(value * 100) / 100

  const hasDecimals = Math.abs(rounded - Math.trunc(rounded)) > Number.EPSILON

  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rounded)
}

function normalizeMoneyInput(value: string, allowNegative: boolean) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  if (allowNegative && trimmed === '-') {
    return '-'
  }

  const negative = allowNegative && trimmed.startsWith('-')

  const cleaned = value.replace(/[^\d,.]/g, '').replace(/\./g, '')

  const commaIndex = cleaned.indexOf(',')

  const integerPart = commaIndex >= 0 ? cleaned.slice(0, commaIndex) : cleaned

  const decimalPart =
    commaIndex >= 0
      ? cleaned
          .slice(commaIndex + 1)
          .replace(/,/g, '')
          .slice(0, 2)
      : ''

  const integerDigits = integerPart.replace(/\D/g, '') || '0'

  const normalizedInteger = integerDigits.replace(/^0+(?=\d)/, '') || '0'

  const formattedInteger = new Intl.NumberFormat('id-ID').format(
    Number(normalizedInteger),
  )

  const sign = negative ? '-' : ''

  if (commaIndex >= 0) {
    return `${sign}${formattedInteger},${decimalPart}`
  }

  return `${sign}${formattedInteger}`
}

function parseMoneyInput(value: string) {
  if (!value || value === '-' || value === '-0') {
    return 0
  }

  const normalized = value.replace(/\./g, '').replace(',', '.')

  const parsed = Number(normalized)

  if (!Number.isFinite(parsed)) {
    return 0
  }

  return Math.round(parsed * 100) / 100
}

export function MoneyInput({
  id,
  value,
  onChange,
  onBlur,
  allowNegative = false,
  placeholder = '0',
  className,
  invalid,
  disabled,
}: MoneyInputProps) {
  const [displayValue, setDisplayValue] = useState(() => formatMoney(value))

  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatMoney(value))
    }
  }, [value, isFocused])

  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
      disabled={disabled}
      value={displayValue}
      aria-invalid={invalid}
      className={className}
      onFocus={() => {
        setIsFocused(true)
      }}
      onChange={(event) => {
        const formatted = normalizeMoneyInput(event.target.value, allowNegative)

        setDisplayValue(formatted)

        onChange(parseMoneyInput(formatted))
      }}
      onBlur={() => {
        const parsed = parseMoneyInput(displayValue)

        onChange(parsed)

        setDisplayValue(formatMoney(parsed))

        setIsFocused(false)

        onBlur?.()
      }}
    />
  )
}
