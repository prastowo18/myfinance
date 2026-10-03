import { z } from 'zod'

export const transactionTypeSchema = z.enum([
  'expense',
  'income',
  'transfer',
  'investment',
])

export const transactionSchema = z
  .object({
    type: transactionTypeSchema,

    title: z
      .string()
      .trim()
      .min(1, 'Nama transaksi wajib diisi')
      .max(100, 'Nama transaksi terlalu panjang'),

    amount: z
      .number()
      .int('Nominal harus berupa angka bulat')
      .positive('Nominal harus lebih dari 0'),

    accountId: z.string().min(1, 'Account wajib dipilih'),

    categoryId: z.string().optional(),

    targetAccountId: z.string().optional(),

    transactionDate: z.string().min(1, 'Tanggal wajib diisi'),

    note: z.string().trim().max(500, 'Catatan terlalu panjang').optional(),
  })

  .refine(
    (data) => {
      if (data.type === 'expense' || data.type === 'income') {
        return Boolean(data.categoryId)
      }

      return true
    },
    {
      error: 'Kategori wajib dipilih',
      path: ['categoryId'],
    },
  )

  .refine(
    (data) => {
      if (data.type === 'transfer' || data.type === 'investment') {
        return Boolean(data.targetAccountId)
      }

      return true
    },
    {
      error: 'Account tujuan wajib dipilih',
      path: ['targetAccountId'],
    },
  )

  .refine(
    (data) => {
      if (data.type === 'transfer' && data.targetAccountId) {
        return data.accountId !== data.targetAccountId
      }

      return true
    },
    {
      error: 'Account asal dan tujuan tidak boleh sama',
      path: ['targetAccountId'],
    },
  )

export type TransactionFormValues = z.infer<typeof transactionSchema>

export const transactionHistoryFilterSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Format bulan tidak valid')
    .optional(),

  type: transactionTypeSchema.optional(),

  accountId: z.string().uuid('ID account tidak valid').optional(),

  categoryId: z.string().uuid('ID kategori tidak valid').optional(),

  search: z.string().trim().max(100, 'Pencarian terlalu panjang').optional(),
})

export type TransactionHistoryFilterValues = z.infer<
  typeof transactionHistoryFilterSchema
>

export const updateTransactionSchema = transactionSchema.and(
  z.object({
    id: z.string().uuid('ID transaksi tidak valid'),
  }),
)

export const deleteTransactionSchema = z.object({
  id: z.string().uuid('ID transaksi tidak valid'),
})

export type UpdateTransactionFormValues = z.infer<
  typeof updateTransactionSchema
>

export type DeleteTransactionValues = z.infer<typeof deleteTransactionSchema>
