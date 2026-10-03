import { createServerFn } from '@tanstack/react-start'

import {
  deleteTransactionSchema,
  transactionHistoryFilterSchema,
  transactionSchema,
  updateTransactionSchema,
} from '#/schemas/transaction'
import {
  createTransactionRecord,
  deleteTransactionRecord,
  findTransactions,
  findTransactionSuggestions,
  updateTransactionRecord,
} from './transactions.server'

export const createTransaction = createServerFn({
  method: 'POST',
})
  .validator(transactionSchema)
  .handler(async ({ data }) => {
    return createTransactionRecord(data)
  })

export const getTransactions = createServerFn({
  method: 'GET',
})
  .validator(transactionHistoryFilterSchema)
  .handler(async ({ data }) => {
    return findTransactions(data)
  })

export const updateTransaction = createServerFn({
  method: 'POST',
})
  .validator(updateTransactionSchema)
  .handler(async ({ data }) => {
    return updateTransactionRecord(data)
  })

export const deleteTransaction = createServerFn({
  method: 'POST',
})
  .validator(deleteTransactionSchema)
  .handler(async ({ data }) => {
    return deleteTransactionRecord(data)
  })

export const getTransactionSuggestions = createServerFn({
  method: 'GET',
}).handler(async () => {
  return findTransactionSuggestions()
})
