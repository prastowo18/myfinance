import { and, eq, gte, lt, sql } from 'drizzle-orm'

import { db } from '#/db'
import { categories, transactions } from '#/db/schema'
import type { MonthlyReportValues } from '#/schemas/report'

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

function getPreviousMonth(month: string) {
  const [yearString, monthString] = month.split('-')

  const year = Number(yearString)
  const monthNumber = Number(monthString)

  if (monthNumber === 1) {
    return `${year - 1}-12`
  }

  return `${year}-${String(monthNumber - 1).padStart(2, '0')}`
}

function shiftMonth(month: string, offset: number) {
  const [yearString, monthString] = month.split('-')

  const date = new Date(
    Date.UTC(Number(yearString), Number(monthString) - 1 + offset, 1),
  )

  const year = date.getUTCFullYear()
  const monthNumber = date.getUTCMonth() + 1

  return `${year}-${String(monthNumber).padStart(2, '0')}`
}

function getTrendMonths(month: string, count = 12) {
  return Array.from(
    {
      length: count,
    },
    (_, index) => shiftMonth(month, index - (count - 1)),
  )
}

async function getMonthSummary(month: string) {
  const { startDate, nextMonthDate } = getMonthRange(month)

  const rows = await db
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
    )

  const row = rows.at(0)

  const income = row?.income ?? 0
  const expense = row?.expense ?? 0
  const investment = row?.investment ?? 0

  return {
    income,
    expense,
    investment,

    cashFlow: income - expense - investment,
  }
}

async function getCategoryBreakdown(month: string, type: 'expense' | 'income') {
  const { startDate, nextMonthDate } = getMonthRange(month)

  return db
    .select({
      categoryId: categories.id,

      categoryName: categories.name,

      amount: sql<number>`
        coalesce(
          sum(${transactions.amount}),
          0
        )
      `.mapWith(Number),

      transactionCount: sql<number>`
        count(${transactions.id})
      `.mapWith(Number),
    })
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .where(
      and(
        eq(transactions.type, type),
        gte(transactions.transactionDate, startDate),
        lt(transactions.transactionDate, nextMonthDate),
      ),
    )
    .groupBy(categories.id, categories.name)
    .orderBy(
      sql`
        sum(${transactions.amount}) desc
      `,
    )
}

export async function getMonthlyReportRecord(data: MonthlyReportValues) {
  const previousMonth = getPreviousMonth(data.month)

  const trendMonths = getTrendMonths(data.month, 12)

  const trendPromise = Promise.all(
    trendMonths.map(async (month) => ({
      month,
      summary: await getMonthSummary(month),
    })),
  )

  const [
    summary,
    previousSummary,
    expenseByCategory,
    incomeByCategory,
    previousExpenseByCategory,
    trend,
  ] = await Promise.all([
    getMonthSummary(data.month),

    getMonthSummary(previousMonth),

    getCategoryBreakdown(data.month, 'expense'),

    getCategoryBreakdown(data.month, 'income'),

    getCategoryBreakdown(previousMonth, 'expense'),

    trendPromise,
  ])

  return {
    month: data.month,
    previousMonth,

    summary,
    previousSummary,

    expenseByCategory: expenseByCategory.map((category) => ({
      ...category,

      percentage:
        summary.expense > 0 ? (category.amount / summary.expense) * 100 : 0,
    })),

    incomeByCategory: incomeByCategory.map((category) => ({
      ...category,

      percentage:
        summary.income > 0 ? (category.amount / summary.income) * 100 : 0,
    })),

    previousExpenseByCategory: previousExpenseByCategory.map((category) => ({
      ...category,

      percentage:
        previousSummary.expense > 0
          ? (category.amount / previousSummary.expense) * 100
          : 0,
    })),

    trend,
  }
}
