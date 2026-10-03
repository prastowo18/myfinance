export type TrendRange = 3 | 6 | 12

export type ReportSummary = {
  income: number
  expense: number
  investment: number
  cashFlow: number
}

export type CategoryBreakdownItem = {
  categoryId: string
  categoryName: string
  amount: number
  transactionCount: number
  percentage: number
}

export type ExpenseCategoryChange = {
  categoryId: string
  categoryName: string
  currentAmount: number
  previousAmount: number
  difference: number
  percentageChange: number | null
}

export type TrendItem = {
  month: string

  summary: ReportSummary
}
