import { createServerFn } from '@tanstack/react-start'

import {
  favoriteIdSchema,
  favoriteSchema,
  updateFavoriteSchema,
} from '#/schemas/favorite'
import {
  createFavoriteRecord,
  deactivateFavoriteRecord,
  findFavorites,
  updateFavoriteRecord,
} from './favorites.server'

export const getFavorites = createServerFn({
  method: 'GET',
}).handler(async () => {
  return findFavorites()
})

export const createFavorite = createServerFn({
  method: 'POST',
})
  .validator(favoriteSchema)
  .handler(async ({ data }) => {
    return createFavoriteRecord(data)
  })

export const updateFavorite = createServerFn({
  method: 'POST',
})
  .validator(updateFavoriteSchema)
  .handler(async ({ data }) => {
    return updateFavoriteRecord(data)
  })

export const deactivateFavorite = createServerFn({
  method: 'POST',
})
  .validator(favoriteIdSchema)
  .handler(async ({ data }) => {
    return deactivateFavoriteRecord(data.id)
  })
