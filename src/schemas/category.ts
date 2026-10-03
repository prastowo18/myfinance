import { z } from 'zod'

export const categoryTypeSchema = z.enum(['expense', 'income'])

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama kategori wajib diisi')
    .max(100, 'Nama kategori terlalu panjang'),

  type: categoryTypeSchema,
})

export type CategoryFormValues = z.infer<typeof categorySchema>

export const updateCategorySchema = z.object({
  id: z.string().uuid('ID kategori tidak valid'),

  name: z
    .string()
    .trim()
    .min(1, 'Nama kategori wajib diisi')
    .max(100, 'Nama kategori terlalu panjang'),

  isActive: z.boolean(),
})

export type UpdateCategoryFormValues = z.infer<typeof updateCategorySchema>
