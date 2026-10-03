import { and, desc, eq, gte, lt, sql } from 'drizzle-orm'

import { db } from '#/db'
import { accounts, categories, transactions } from '#/db/schema'
import { findAccounts } from './accounts.server'

function getJakartaDateParts() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = Number(parts.find((part) => part.type === 'year')?.value)

  const month = Number(parts.find((part) => part.type === 'month')?.value)

  const day = Number(parts.find((part) => part.type === 'day')?.value)

  return {
    year,
    month,
    day,
  }
}

function getCurrentMonthRange() {
  const { year, month } = getJakartaDateParts()

  const monthString = String(month).padStart(2, '0')

  const nextMonth =
    month === 12
      ? {
          year: year + 1,
          month: 1,
        }
      : {
          year,
          month: month + 1,
        }

  const nextMonthString = String(nextMonth.month).padStart(2, '0')

  return {
    startDate: `${year}-${monthString}-01`,
    nextMonthDate: `${nextMonth.year}-${nextMonthString}-01`,
  }
}

export async function getDashboardDataRecord() {
  const { startDate, nextMonthDate } = getCurrentMonthRange()

  const [accountRows, summaryRows, latestTransactions] = await Promise.all([
    findAccounts(),

    db
      .select({
        income: sql<number>`
          coalesce(
            sum(
              case
                when ${transactions.type} = 'income'
                then ${transactions.amount}
                else 0
              end
            ),
            0
          )
        `.mapWith(Number),

        expense: sql<number>`
          coalesce(
            sum(
              case
                when ${transactions.type} = 'expense'
                then ${transactions.amount}
                else 0
              end
            ),
            0
          )
        `.mapWith(Number),

        investment: sql<number>`
          coalesce(
            sum(
              case
                when ${transactions.type} = 'investment'
                then ${transactions.amount}
                else 0
              end
            ),
            0
          )
        `.mapWith(Number),
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.transactionDate, startDate),
          lt(transactions.transactionDate, nextMonthDate),
        ),
      ),

    db
      .select({
        id: transactions.id,
        type: transactions.type,
        title: transactions.title,
        amount: transactions.amount,
        transactionDate: transactions.transactionDate,

        accountName: accounts.name,

        categoryName: categories.name,

        targetAccountName: sql<string | null>`
          (
            select target_account.name
            from ${accounts} as target_account
            where target_account.id =
              ${transactions.targetAccountId}
          )
        `,
      })
      .from(transactions)
      .innerJoin(accounts, eq(accounts.id, transactions.accountId))
      .leftJoin(categories, eq(categories.id, transactions.categoryId))
      .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt))
      .limit(5),
  ])

  const summary = summaryRows.at(0)

  const totalBalance = accountRows.reduce(
    (total, account) => total + account.balance,
    0,
  )

  const activeBalance = accountRows
    .filter((account) => account.isActive)
    .reduce((total, account) => total + account.balance, 0)

  return {
    totalBalance,
    activeBalance,

    incomeThisMonth: summary?.income ?? 0,

    expenseThisMonth: summary?.expense ?? 0,

    investmentThisMonth: summary?.investment ?? 0,

    cashFlowThisMonth:
      (summary?.income ?? 0) -
      (summary?.expense ?? 0) -
      (summary?.investment ?? 0),

    accounts: accountRows,

    latestTransactions,

    period: {
      startDate,
      nextMonthDate,
    },
  }
}
