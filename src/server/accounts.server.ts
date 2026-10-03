import { and, asc, eq, ilike, ne, or, sql } from 'drizzle-orm'

import { db } from '#/db'
import { accounts, transactions } from '#/db/schema'
import type {
  AccountFormValues,
  UpdateAccountFormValues,
} from '#/schemas/account'

export async function findAccounts() {
  const rows = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      type: accounts.type,
      initialBalance: accounts.initialBalance,
      isActive: accounts.isActive,

      transactionDelta: sql<number>`
        coalesce(
          sum(
            case
              when ${transactions.type} = 'income'
                and ${transactions.accountId} = ${accounts.id}
                then ${transactions.amount}

              when ${transactions.type} = 'expense'
                and ${transactions.accountId} = ${accounts.id}
                then -${transactions.amount}

              when ${transactions.type} in ('transfer', 'investment')
                and ${transactions.accountId} = ${accounts.id}
                then -${transactions.amount}

              when ${transactions.type} in ('transfer', 'investment')
                and ${transactions.targetAccountId} = ${accounts.id}
                then ${transactions.amount}

              else 0
            end
          ),
          0
        )
      `.mapWith(Number),
    })
    .from(accounts)
    .leftJoin(
      transactions,
      or(
        eq(transactions.accountId, accounts.id),
        eq(transactions.targetAccountId, accounts.id),
      ),
    )
    .groupBy(accounts.id)
    .orderBy(asc(accounts.name))

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    initialBalance: row.initialBalance,
    balance: row.initialBalance + row.transactionDelta,
    isActive: row.isActive,
  }))
}

export async function createAccountRecord(data: AccountFormValues) {
  const existingRows = await db
    .select({
      id: accounts.id,
    })
    .from(accounts)
    .where(ilike(accounts.name, data.name))
    .limit(1)

  const existingAccount = existingRows.at(0)

  if (existingAccount) {
    throw new Error('Account dengan nama tersebut sudah ada')
  }

  const insertedRows = await db
    .insert(accounts)
    .values({
      name: data.name.trim(),
      type: data.type,
      initialBalance: data.initialBalance,
    })
    .returning({
      id: accounts.id,
      name: accounts.name,
      type: accounts.type,
      initialBalance: accounts.initialBalance,
      isActive: accounts.isActive,
    })

  const account = insertedRows.at(0)

  if (!account) {
    throw new Error('Account gagal dibuat')
  }

  return {
    ...account,
    balance: account.initialBalance,
  }
}

export async function updateAccountRecord(data: UpdateAccountFormValues) {
  const accountRows = await db
    .select({
      id: accounts.id,
      type: accounts.type,
    })
    .from(accounts)
    .where(eq(accounts.id, data.id))
    .limit(1)

  const existingAccount = accountRows.at(0)

  if (!existingAccount) {
    throw new Error('Account tidak ditemukan')
  }

  const duplicateRows = await db
    .select({
      id: accounts.id,
    })
    .from(accounts)
    .where(
      and(ilike(accounts.name, data.name.trim()), ne(accounts.id, data.id)),
    )
    .limit(1)

  const duplicateAccount = duplicateRows.at(0)

  if (duplicateAccount) {
    throw new Error('Account dengan nama tersebut sudah ada')
  }

  const updatedRows = await db
    .update(accounts)
    .set({
      name: data.name.trim(),
      initialBalance: data.initialBalance,
      isActive: data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, data.id))
    .returning({
      id: accounts.id,
      name: accounts.name,
      type: accounts.type,
      initialBalance: accounts.initialBalance,
      isActive: accounts.isActive,
    })

  const account = updatedRows.at(0)

  if (!account) {
    throw new Error('Account gagal diperbarui')
  }

  return account
}
