import { z } from 'zod'

export const monthlyReportSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Format bulan tidak valid'),
})

export type MonthlyReportValues = z.infer<typeof monthlyReportSchema>
