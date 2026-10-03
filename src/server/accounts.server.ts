import { and, asc, eq, ilike, ne, or, sql } from 'drizzle-orm'

import { db } from '#/db'
import { accounts, transactions } from '#/db/schema'

import type {
  AccountFormValues,
  AdjustAccountBalanceValues,
  UpdateAccountFormValues,
} from '#/schemas/account'

function moneyToCents(value: number) {
  return Math.round(value * 100)
}

function centsToMoney(value: number) {
  return value / 100
}

function formatRupiah(value: number) {
  const cents = moneyToCents(value)

  const normalized = centsToMoney(cents)

  const hasDecimals = Math.abs(cents % 100) > 0

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(normalized)
}

function getJakartaDateString() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find((part) => part.type === 'year')?.value ?? ''

  const month = parts.find((part) => part.type === 'month')?.value ?? ''

  const day = parts.find((part) => part.type === 'day')?.value ?? ''

  return `${year}-${month}-${day}`
}

const transactionDelta = sql<number>`
    coalesce(
      sum(
        case
          when ${transactions.type} = 'income'
            and ${transactions.accountId} = ${accounts.id}
            then ${transactions.amount}

          when ${transactions.type} = 'expense'
            and ${transactions.accountId} = ${accounts.id}
            then -${transactions.amount}

          when ${transactions.type} = 'adjustment'
            and ${transactions.accountId} = ${accounts.id}
            and ${transactions.adjustmentDirection} = 'increase'
            then ${transactions.amount}

          when ${transactions.type} = 'adjustment'
            and ${transactions.accountId} = ${accounts.id}
            and ${transactions.adjustmentDirection} = 'decrease'
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
  `.mapWith(Number)

export async function findAccounts() {
  const rows = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      type: accounts.type,
      initialBalance: accounts.initialBalance,
      isActive: accounts.isActive,

      transactionDelta,
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

  return rows.map((row) => {
    const balanceCents =
      moneyToCents(row.initialBalance) + moneyToCents(row.transactionDelta)

    return {
      id: row.id,
      name: row.name,
      type: row.type,
      initialBalance: row.initialBalance,
      balance: centsToMoney(balanceCents),
      isActive: row.isActive,
    }
  })
}

async function findAccountWithBalance(id: string) {
  const rows = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      type: accounts.type,
      initialBalance: accounts.initialBalance,
      isActive: accounts.isActive,

      transactionDelta,
    })
    .from(accounts)
    .leftJoin(
      transactions,
      or(
        eq(transactions.accountId, accounts.id),
        eq(transactions.targetAccountId, accounts.id),
      ),
    )
    .where(eq(accounts.id, id))
    .groupBy(accounts.id)
    .limit(1)

  const row = rows.at(0)

  if (!row) {
    return null
  }

  const balanceCents =
    moneyToCents(row.initialBalance) + moneyToCents(row.transactionDelta)

  return {
    ...row,
    balance: centsToMoney(balanceCents),
  }
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
      initialBalance: centsToMoney(moneyToCents(data.initialBalance)),
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

      initialBalance: centsToMoney(moneyToCents(data.initialBalance)),

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

export async function adjustAccountBalanceRecord(
  data: AdjustAccountBalanceValues,
) {
  const account = await findAccountWithBalance(data.accountId)

  if (!account) {
    throw new Error('Account tidak ditemukan')
  }

  if (!account.isActive) {
    throw new Error('Account sudah nonaktif')
  }

  const previousBalanceCents = moneyToCents(account.balance)

  const actualBalanceCents = moneyToCents(data.actualBalance)

  const differenceCents = actualBalanceCents - previousBalanceCents

  const previousBalance = centsToMoney(previousBalanceCents)

  const actualBalance = centsToMoney(actualBalanceCents)

  if (differenceCents === 0) {
    return {
      changed: false as const,

      accountId: account.id,

      accountName: account.name,

      previousBalance,

      actualBalance,

      difference: 0,
    }
  }

  const adjustmentDirection = differenceCents > 0 ? 'increase' : 'decrease'

  const amount = centsToMoney(Math.abs(differenceCents))

  const difference = centsToMoney(differenceCents)

  const auditNote = [
    `Saldo sebelumnya ${formatRupiah(previousBalance)}.`,
    `Saldo aktual ${formatRupiah(actualBalance)}.`,
  ].join(' ')

  const userNote = data.note?.trim()

  const finalNote = userNote ? `${auditNote} ${userNote}` : auditNote

  const transactionDate = getJakartaDateString()

  const insertedRows = await db
    .insert(transactions)
    .values({
      type: 'adjustment',

      title: 'Penyesuaian saldo',

      amount,

      accountId: account.id,

      categoryId: null,

      targetAccountId: null,

      adjustmentDirection,

      transactionDate,

      note: finalNote.slice(0, 500),
    })
    .returning({
      id: transactions.id,
      amount: transactions.amount,
      adjustmentDirection: transactions.adjustmentDirection,
      transactionDate: transactions.transactionDate,
    })

  const adjustment = insertedRows.at(0)

  if (!adjustment) {
    throw new Error('Penyesuaian saldo gagal disimpan')
  }

  return {
    changed: true as const,

    transactionId: adjustment.id,

    accountId: account.id,

    accountName: account.name,

    previousBalance,

    actualBalance,

    difference,

    amount: adjustment.amount,

    adjustmentDirection: adjustment.adjustmentDirection,

    transactionDate: adjustment.transactionDate,
  }
}
