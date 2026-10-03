import { and, asc, eq, ilike, ne } from 'drizzle-orm'

import { db } from '#/db'
import { categories } from '#/db/schema'
import type {
  CategoryFormValues,
  UpdateCategoryFormValues,
} from '#/schemas/category'

export async function findCategories() {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      type: categories.type,
      isActive: categories.isActive,
    })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.type), asc(categories.name))
}

export async function findAllCategories() {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      type: categories.type,
      isActive: categories.isActive,
    })
    .from(categories)
    .orderBy(asc(categories.type), asc(categories.name))
}

export async function createCategoryRecord(data: CategoryFormValues) {
  const duplicateRows = await db
    .select({
      id: categories.id,
    })
    .from(categories)
    .where(
      and(
        ilike(categories.name, data.name.trim()),
        eq(categories.type, data.type),
      ),
    )
    .limit(1)

  const duplicateCategory = duplicateRows.at(0)

  if (duplicateCategory) {
    throw new Error('Kategori dengan nama tersebut sudah ada')
  }

  const insertedRows = await db
    .insert(categories)
    .values({
      name: data.name.trim(),
      type: data.type,
    })
    .returning({
      id: categories.id,
      name: categories.name,
      type: categories.type,
      isActive: categories.isActive,
    })

  const category = insertedRows.at(0)

  if (!category) {
    throw new Error('Kategori gagal dibuat')
  }

  return category
}

export async function updateCategoryRecord(data: UpdateCategoryFormValues) {
  const categoryRows = await db
    .select({
      id: categories.id,
      type: categories.type,
    })
    .from(categories)
    .where(eq(categories.id, data.id))
    .limit(1)

  const existingCategory = categoryRows.at(0)

  if (!existingCategory) {
    throw new Error('Kategori tidak ditemukan')
  }

  const duplicateRows = await db
    .select({
      id: categories.id,
    })
    .from(categories)
    .where(
      and(
        ilike(categories.name, data.name.trim()),
        eq(categories.type, existingCategory.type),
        ne(categories.id, data.id),
      ),
    )
    .limit(1)

  const duplicateCategory = duplicateRows.at(0)

  if (duplicateCategory) {
    throw new Error('Kategori dengan nama tersebut sudah ada')
  }

  const updatedRows = await db
    .update(categories)
    .set({
      name: data.name.trim(),
      isActive: data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, data.id))
    .returning({
      id: categories.id,
      name: categories.name,
      type: categories.type,
      isActive: categories.isActive,
    })

  const category = updatedRows.at(0)

  if (!category) {
    throw new Error('Kategori gagal diperbarui')
  }

  return category
}
