import type {
  CategoryBreakdownItem,
  ExpenseCategoryChange,
} from './report-types'

export function buildExpenseCategoryChanges(
  current: CategoryBreakdownItem[],
  previous: CategoryBreakdownItem[],
): ExpenseCategoryChange[] {
  const currentMap = new Map(current.map((item) => [item.categoryId, item]))

  const previousMap = new Map(previous.map((item) => [item.categoryId, item]))

  const categoryIds = new Set([...currentMap.keys(), ...previousMap.keys()])

  return Array.from(categoryIds)
    .map((categoryId) => {
      const currentItem = currentMap.get(categoryId)

      const previousItem = previousMap.get(categoryId)

      const currentAmount = currentItem?.amount ?? 0

      const previousAmount = previousItem?.amount ?? 0

      return {
        categoryId,

        categoryName:
          currentItem?.categoryName ?? previousItem?.categoryName ?? 'Kategori',

        currentAmount,

        previousAmount,

        difference: currentAmount - previousAmount,

        percentageChange:
          previousAmount > 0
            ? ((currentAmount - previousAmount) / previousAmount) * 100
            : null,
      }
    })
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
}
