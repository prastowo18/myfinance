import { z } from 'zod'

const MAX_MONEY_VALUE = 9_999_999_999_999.99

function hasAtMostTwoDecimals(value: number) {
  const cents = value * 100

  return Math.abs(cents - Math.round(cents)) < 0.000001
}

const accountBalanceSchema = z
  .number()
  .min(-MAX_MONEY_VALUE, 'Saldo terlalu kecil')
  .max(MAX_MONEY_VALUE, 'Saldo terlalu besar')
  .refine(hasAtMostTwoDecimals, {
    error: 'Saldo maksimal 2 angka di belakang koma',
  })

export const accountTypeSchema = z.enum([
  'bank',
  'ewallet',
  'cash',
  'credit_card',
  'investment',
])

export const accountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama account wajib diisi')
    .max(100, 'Nama account terlalu panjang'),

  type: accountTypeSchema,

  initialBalance: accountBalanceSchema,
})

export type AccountFormValues = z.infer<typeof accountSchema>

export const updateAccountSchema = z.object({
  id: z.string().uuid('ID account tidak valid'),

  name: z
    .string()
    .trim()
    .min(1, 'Nama account wajib diisi')
    .max(100, 'Nama account terlalu panjang'),

  initialBalance: accountBalanceSchema,

  isActive: z.boolean(),
})

export type UpdateAccountFormValues = z.infer<typeof updateAccountSchema>

export const adjustAccountBalanceSchema = z.object({
  accountId: z.string().uuid('ID account tidak valid'),

  actualBalance: accountBalanceSchema,

  note: z.string().trim().max(300, 'Catatan terlalu panjang').optional(),
})

export type AdjustAccountBalanceValues = z.infer<
  typeof adjustAccountBalanceSchema
>
