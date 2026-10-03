import { createServerFn } from '@tanstack/react-start'

import { categorySchema, updateCategorySchema } from '#/schemas/category'
import {
  createCategoryRecord,
  findAllCategories,
  findCategories,
  updateCategoryRecord,
} from './categories.server'

export const getCategories = createServerFn({
  method: 'GET',
}).handler(async () => {
  return findCategories()
})

export const getAllCategories = createServerFn({
  method: 'GET',
}).handler(async () => {
  return findAllCategories()
})

export const createCategory = createServerFn({
  method: 'POST',
})
  .validator(categorySchema)
  .handler(async ({ data }) => {
    return createCategoryRecord(data)
  })

export const updateCategory = createServerFn({
  method: 'POST',
})
  .validator(updateCategorySchema)
  .handler(async ({ data }) => {
    return updateCategoryRecord(data)
  })
