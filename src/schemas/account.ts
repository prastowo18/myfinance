import { z } from 'zod'

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

  initialBalance: z
    .number()
    .int('Saldo awal harus berupa angka bulat')
    .safe('Saldo awal terlalu besar'),
})

export type AccountFormValues = z.infer<typeof accountSchema>

export const updateAccountSchema = z.object({
  id: z.string().uuid('ID account tidak valid'),

  name: z
    .string()
    .trim()
    .min(1, 'Nama account wajib diisi')
    .max(100, 'Nama account terlalu panjang'),

  initialBalance: z
    .number()
    .int('Saldo awal harus berupa angka bulat')
    .safe('Saldo awal terlalu besar'),

  isActive: z.boolean(),
})

export type UpdateAccountFormValues = z.infer<typeof updateAccountSchema>
