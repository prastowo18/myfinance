import { z } from 'zod'

export const favoriteTypeSchema = z.enum([
  'expense',
  'income',
  'transfer',
  'investment',
])

const favoriteFields = {
  title: z
    .string()
    .trim()
    .min(1, 'Nama favorit wajib diisi')
    .max(100, 'Nama favorit terlalu panjang'),

  type: favoriteTypeSchema,

  amount: z
    .number()
    .int('Nominal harus berupa angka bulat')
    .positive('Nominal harus lebih dari 0')
    .safe('Nominal terlalu besar'),

  accountId: z.string().uuid('Account tidak valid'),

  categoryId: z.string().uuid('Kategori tidak valid').optional(),

  targetAccountId: z.string().uuid('Account tujuan tidak valid').optional(),

  note: z.string().trim().max(500, 'Catatan maksimal 500 karakter').optional(),
}

function validateFavorite(
  data: {
    type: 'expense' | 'income' | 'transfer' | 'investment'
    accountId: string
    categoryId?: string
    targetAccountId?: string
  },
  ctx: z.RefinementCtx,
) {
  if ((data.type === 'expense' || data.type === 'income') && !data.categoryId) {
    ctx.addIssue({
      code: 'custom',
      path: ['categoryId'],
      message: 'Kategori wajib dipilih',
    })
  }

  if (
    (data.type === 'transfer' || data.type === 'investment') &&
    !data.targetAccountId
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['targetAccountId'],
      message: 'Account tujuan wajib dipilih',
    })
  }

  if (data.targetAccountId && data.accountId === data.targetAccountId) {
    ctx.addIssue({
      code: 'custom',
      path: ['targetAccountId'],
      message: 'Account asal dan tujuan tidak boleh sama',
    })
  }
}

export const favoriteSchema = z
  .object(favoriteFields)
  .superRefine(validateFavorite)

export const updateFavoriteSchema = z
  .object({
    id: z.string().uuid('ID favorit tidak valid'),
    ...favoriteFields,
  })
  .superRefine(validateFavorite)

export const favoriteIdSchema = z.object({
  id: z.string().uuid('ID favorit tidak valid'),
})

export type FavoriteFormValues = z.infer<typeof favoriteSchema>

export type UpdateFavoriteValues = z.infer<typeof updateFavoriteSchema>

export type FavoriteIdValues = z.infer<typeof favoriteIdSchema>
