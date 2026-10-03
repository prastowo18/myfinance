import type { SQL } from 'drizzle-orm'
import { and, desc, eq, gte, ilike, lt, or, sql } from 'drizzle-orm'

import { db } from '#/db'
import { accounts, categories, transactions } from '#/db/schema'
import type {
  DeleteTransactionValues,
  TransactionFormValues,
  TransactionHistoryFilterValues,
  UpdateTransactionFormValues,
} from '#/schemas/transaction'

export async function createTransactionRecord(data: TransactionFormValues) {
  const sourceAccountRows = await db
    .select({
      id: accounts.id,
      type: accounts.type,
    })
    .from(accounts)
    .where(and(eq(accounts.id, data.accountId), eq(accounts.isActive, true)))
    .limit(1)

  const sourceAccount = sourceAccountRows.at(0)

  if (!sourceAccount) {
    throw new Error('Account asal tidak ditemukan')
  }

  if (sourceAccount.type === 'investment') {
    throw new Error(
      'Account investasi tidak dapat digunakan sebagai account asal',
    )
  }

  let categoryId: string | null = null
  let targetAccountId: string | null = null

  if (data.type === 'expense' || data.type === 'income') {
    if (!data.categoryId) {
      throw new Error('Kategori wajib dipilih')
    }

    const categoryRows = await db
      .select({
        id: categories.id,
        type: categories.type,
      })
      .from(categories)
      .where(
        and(eq(categories.id, data.categoryId), eq(categories.isActive, true)),
      )
      .limit(1)

    const category = categoryRows.at(0)

    if (!category) {
      throw new Error('Kategori tidak ditemukan')
    }

    if (category.type !== data.type) {
      throw new Error('Kategori tidak sesuai dengan jenis transaksi')
    }

    categoryId = category.id
  }

  if (data.type === 'transfer' || data.type === 'investment') {
    if (!data.targetAccountId) {
      throw new Error('Account tujuan wajib dipilih')
    }

    const targetAccountRows = await db
      .select({
        id: accounts.id,
        type: accounts.type,
      })
      .from(accounts)
      .where(
        and(eq(accounts.id, data.targetAccountId), eq(accounts.isActive, true)),
      )
      .limit(1)

    const targetAccount = targetAccountRows.at(0)

    if (!targetAccount) {
      throw new Error('Account tujuan tidak ditemukan')
    }

    if (targetAccount.id === sourceAccount.id) {
      throw new Error('Account asal dan tujuan tidak boleh sama')
    }

    if (data.type === 'investment' && targetAccount.type !== 'investment') {
      throw new Error('Tujuan investasi harus berupa account investasi')
    }

    if (data.type === 'transfer' && targetAccount.type === 'investment') {
      throw new Error(
        'Transfer ke account investasi harus dicatat sebagai investasi',
      )
    }

    targetAccountId = targetAccount.id
  }

  const insertedTransactions = await db
    .insert(transactions)
    .values({
      type: data.type,
      title: data.title,
      amount: data.amount,
      accountId: sourceAccount.id,
      categoryId,
      targetAccountId,
      transactionDate: data.transactionDate,
      note: data.note?.trim() || null,
    })
    .returning({
      id: transactions.id,
      type: transactions.type,
      title: transactions.title,
      amount: transactions.amount,
      transactionDate: transactions.transactionDate,
    })

  const transaction = insertedTransactions.at(0)

  if (!transaction) {
    throw new Error('Transaksi gagal disimpan')
  }

  return transaction
}

function getMonthRange(month: string) {
  const [yearString, monthString] = month.split('-')

  const year = Number(yearString)
  const monthNumber = Number(monthString)

  const nextMonth =
    monthNumber === 12
      ? {
          year: year + 1,
          month: 1,
        }
      : {
          year,
          month: monthNumber + 1,
        }

  return {
    startDate: `${year}-${String(monthNumber).padStart(2, '0')}-01`,

    nextMonthDate: `${nextMonth.year}-${String(nextMonth.month).padStart(
      2,
      '0',
    )}-01`,
  }
}

export async function findTransactions(
  filters: TransactionHistoryFilterValues,
) {
  const conditions: SQL[] = []

  if (filters.month) {
    const { startDate, nextMonthDate } = getMonthRange(filters.month)

    conditions.push(gte(transactions.transactionDate, startDate))

    conditions.push(lt(transactions.transactionDate, nextMonthDate))
  }

  if (filters.type) {
    conditions.push(eq(transactions.type, filters.type))
  }

  if (filters.accountId) {
    const accountCondition = or(
      eq(transactions.accountId, filters.accountId),
      eq(transactions.targetAccountId, filters.accountId),
    )

    if (accountCondition) {
      conditions.push(accountCondition)
    }
  }

  if (filters.categoryId) {
    conditions.push(eq(transactions.categoryId, filters.categoryId))
  }

  if (filters.search?.trim()) {
    const searchValue = `%${filters.search.trim()}%`

    const searchCondition = or(
      ilike(transactions.title, searchValue),
      ilike(transactions.note, searchValue),
    )

    if (searchCondition) {
      conditions.push(searchCondition)
    }
  }

  return db
    .select({
      id: transactions.id,
      type: transactions.type,
      title: transactions.title,
      amount: transactions.amount,

      transactionDate: transactions.transactionDate,

      note: transactions.note,

      accountId: transactions.accountId,
      accountName: accounts.name,

      categoryId: transactions.categoryId,
      categoryName: categories.name,

      targetAccountId: transactions.targetAccountId,

      targetAccountName: sql<string | null>`
        (
          select target_account.name
          from ${accounts} as target_account
          where target_account.id =
            ${transactions.targetAccountId}
        )
      `,

      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt))
    .limit(100)
}

export async function updateTransactionRecord(
  data: UpdateTransactionFormValues,
) {
  const currentRows = await db
    .select({
      id: transactions.id,
      accountId: transactions.accountId,
      categoryId: transactions.categoryId,
      targetAccountId: transactions.targetAccountId,
    })
    .from(transactions)
    .where(eq(transactions.id, data.id))
    .limit(1)

  const currentTransaction = currentRows.at(0)

  if (!currentTransaction) {
    throw new Error('Transaksi tidak ditemukan')
  }

  const sourceRows = await db
    .select({
      id: accounts.id,
      type: accounts.type,
      isActive: accounts.isActive,
    })
    .from(accounts)
    .where(eq(accounts.id, data.accountId))
    .limit(1)

  const sourceAccount = sourceRows.at(0)

  if (!sourceAccount) {
    throw new Error('Account asal tidak ditemukan')
  }

  if (
    !sourceAccount.isActive &&
    sourceAccount.id !== currentTransaction.accountId
  ) {
    throw new Error('Account asal yang dipilih sudah nonaktif')
  }

  if (sourceAccount.type === 'investment') {
    throw new Error(
      'Account investasi tidak dapat digunakan sebagai account asal',
    )
  }

  let categoryId: string | null = null
  let targetAccountId: string | null = null

  if (data.type === 'expense' || data.type === 'income') {
    if (!data.categoryId) {
      throw new Error('Kategori wajib dipilih')
    }

    const categoryRows = await db
      .select({
        id: categories.id,
        type: categories.type,
        isActive: categories.isActive,
      })
      .from(categories)
      .where(eq(categories.id, data.categoryId))
      .limit(1)

    const category = categoryRows.at(0)

    if (!category) {
      throw new Error('Kategori tidak ditemukan')
    }

    if (!category.isActive && category.id !== currentTransaction.categoryId) {
      throw new Error('Kategori yang dipilih sudah nonaktif')
    }

    if (category.type !== data.type) {
      throw new Error('Kategori tidak sesuai dengan jenis transaksi')
    }

    categoryId = category.id
  }

  if (data.type === 'transfer' || data.type === 'investment') {
    if (!data.targetAccountId) {
      throw new Error('Account tujuan wajib dipilih')
    }

    const targetRows = await db
      .select({
        id: accounts.id,
        type: accounts.type,
        isActive: accounts.isActive,
      })
      .from(accounts)
      .where(eq(accounts.id, data.targetAccountId))
      .limit(1)

    const targetAccount = targetRows.at(0)

    if (!targetAccount) {
      throw new Error('Account tujuan tidak ditemukan')
    }

    if (
      !targetAccount.isActive &&
      targetAccount.id !== currentTransaction.targetAccountId
    ) {
      throw new Error('Account tujuan yang dipilih sudah nonaktif')
    }

    if (targetAccount.id === sourceAccount.id) {
      throw new Error('Account asal dan tujuan tidak boleh sama')
    }

    if (data.type === 'investment' && targetAccount.type !== 'investment') {
      throw new Error('Tujuan investasi harus berupa account investasi')
    }

    if (data.type === 'transfer' && targetAccount.type === 'investment') {
      throw new Error(
        'Transfer ke account investasi harus dicatat sebagai investasi',
      )
    }

    targetAccountId = targetAccount.id
  }

  const updatedRows = await db
    .update(transactions)
    .set({
      type: data.type,
      title: data.title,
      amount: data.amount,
      accountId: sourceAccount.id,
      categoryId,
      targetAccountId,
      transactionDate: data.transactionDate,
      note: data.note?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(transactions.id, data.id))
    .returning({
      id: transactions.id,
      type: transactions.type,
      title: transactions.title,
      amount: transactions.amount,
      transactionDate: transactions.transactionDate,
    })

  const transaction = updatedRows.at(0)

  if (!transaction) {
    throw new Error('Transaksi gagal diperbarui')
  }

  return transaction
}

export async function deleteTransactionRecord(data: DeleteTransactionValues) {
  const deletedRows = await db
    .delete(transactions)
    .where(eq(transactions.id, data.id))
    .returning({
      id: transactions.id,
      title: transactions.title,
    })

  const transaction = deletedRows.at(0)

  if (!transaction) {
    throw new Error('Transaksi tidak ditemukan')
  }

  return transaction
}

export async function findTransactionSuggestions() {
  const rows = await db
    .select({
      title: transactions.title,
      amount: transactions.amount,

      accountId: accounts.id,
      accountName: accounts.name,

      categoryId: categories.id,
      categoryName: categories.name,

      transactionDate: transactions.transactionDate,

      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .where(
      and(
        eq(transactions.type, 'expense'),
        eq(accounts.isActive, true),
        eq(categories.isActive, true),
      ),
    )
    .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt))
    .limit(200)

  const grouped = new Map<
    string,
    {
      title: string
      accountId: string
      accountName: string
      categoryId: string
      categoryName: string
      lastAmount: number
      usageCount: number
      lastUsedDate: string
    }
  >()

  for (const row of rows) {
    const normalizedTitle = row.title.trim().toLowerCase()

    const key = [normalizedTitle, row.accountId, row.categoryId].join('|')

    const existing = grouped.get(key)

    if (existing) {
      existing.usageCount += 1
      continue
    }

    grouped.set(key, {
      title: row.title,
      accountId: row.accountId,
      accountName: row.accountName,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      lastAmount: row.amount,
      usageCount: 1,
      lastUsedDate: row.transactionDate,
    })
  }

  return Array.from(grouped.values())
    .sort((a, b) => {
      if (b.usageCount !== a.usageCount) {
        return b.usageCount - a.usageCount
      }

      return b.lastUsedDate.localeCompare(a.lastUsedDate)
    })
    .slice(0, 10)
}
