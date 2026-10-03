import { createServerFn } from '@tanstack/react-start'

import { getDashboardDataRecord } from './dashboard.server'

export const getDashboardData = createServerFn({
  method: 'GET',
}).handler(async () => {
  return getDashboardDataRecord()
})
