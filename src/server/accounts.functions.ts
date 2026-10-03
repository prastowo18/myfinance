import { createServerFn } from '@tanstack/react-start'

import {
  createAccountRecord,
  findAccounts,
  updateAccountRecord,
} from './accounts.server'
import { accountSchema, updateAccountSchema } from '#/schemas/account'

export const getAccounts = createServerFn({
  method: 'GET',
}).handler(async () => {
  return findAccounts()
})

export const createAccount = createServerFn({
  method: 'POST',
})
  .validator(accountSchema)
  .handler(async ({ data }) => {
    return createAccountRecord(data)
  })

export const updateAccount = createServerFn({
  method: 'POST',
})
  .validator(updateAccountSchema)
  .handler(async ({ data }) => {
    return updateAccountRecord(data)
  })
