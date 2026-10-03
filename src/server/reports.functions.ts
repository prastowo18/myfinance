import { createServerFn } from '@tanstack/react-start'

import { monthlyReportSchema } from '#/schemas/report'
import { getMonthlyReportRecord } from './reports.server'

export const getMonthlyReport = createServerFn({
  method: 'GET',
})
  .validator(monthlyReportSchema)
  .handler(async ({ data }) => {
    return getMonthlyReportRecord(data)
  })
