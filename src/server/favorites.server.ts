import { and, asc, eq, ilike } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import { db } from '#/db'
import { accounts, categories, transactionFavorites } from '#/db/schema'
import type {
  FavoriteFormValues,
  UpdateFavoriteValues,
} from '#/schemas/favorite'

const targetAccounts = alias(accounts, 'favorite_target_accounts')

type FavoriteTransactionType = 'expense' | 'income' | 'transfer' | 'investment'

async function validateReferences(
  data: FavoriteFormValues | UpdateFavoriteValues,
) {
  const sourceAccount = (
    await db
      .select({
        id: accounts.id,
        type: accounts.type,
        isActive: accounts.isActive,
      })
      .from(accounts)
      .where(eq(accounts.id, data.accountId))
      .limit(1)
  ).at(0)

  if (!sourceAccount || !sourceAccount.isActive) {
    throw new Error('Account asal tidak tersedia')
  }

  if (sourceAccount.type === 'investment') {
    throw new Error(
      'Account investasi tidak dapat digunakan sebagai account asal',
    )
  }

  if (data.type === 'expense' || data.type === 'income') {
    if (!data.categoryId) {
      throw new Error('Kategori wajib dipilih')
    }

    const category = (
      await db
        .select({
          id: categories.id,
          type: categories.type,
          isActive: categories.isActive,
        })
        .from(categories)
        .where(eq(categories.id, data.categoryId))
        .limit(1)
    ).at(0)

    if (!category || !category.isActive) {
      throw new Error('Kategori tidak tersedia')
    }

    if (category.type !== data.type) {
      throw new Error('Jenis kategori tidak sesuai dengan transaksi')
    }
  }

  if (data.type === 'transfer' || data.type === 'investment') {
    if (!data.targetAccountId) {
      throw new Error('Account tujuan wajib dipilih')
    }

    if (data.accountId === data.targetAccountId) {
      throw new Error('Account asal dan tujuan tidak boleh sama')
    }

    const targetAccount = (
      await db
        .select({
          id: accounts.id,
          type: accounts.type,
          isActive: accounts.isActive,
        })
        .from(accounts)
        .where(eq(accounts.id, data.targetAccountId))
        .limit(1)
    ).at(0)

    if (!targetAccount || !targetAccount.isActive) {
      throw new Error('Account tujuan tidak tersedia')
    }

    if (data.type === 'investment' && targetAccount.type !== 'investment') {
      throw new Error('Tujuan investasi harus berupa account investasi')
    }

    if (data.type === 'transfer' && targetAccount.type === 'investment') {
      throw new Error(
        'Gunakan jenis transaksi Investasi untuk memindahkan dana ke account investasi',
      )
    }
  }
}

export async function findFavorites() {
  const rows = await db
    .select({
      id: transactionFavorites.id,
      title: transactionFavorites.title,
      type: transactionFavorites.type,
      amount: transactionFavorites.amount,

      accountId: transactionFavorites.accountId,
      accountName: accounts.name,

      categoryId: transactionFavorites.categoryId,
      categoryName: categories.name,

      targetAccountId: transactionFavorites.targetAccountId,
      targetAccountName: targetAccounts.name,

      note: transactionFavorites.note,
      isActive: transactionFavorites.isActive,
    })
    .from(transactionFavorites)
    .innerJoin(accounts, eq(accounts.id, transactionFavorites.accountId))
    .leftJoin(categories, eq(categories.id, transactionFavorites.categoryId))
    .leftJoin(
      targetAccounts,
      eq(targetAccounts.id, transactionFavorites.targetAccountId),
    )
    .where(eq(transactionFavorites.isActive, true))
    .orderBy(asc(transactionFavorites.title))

  return rows.filter(
    (
      row,
    ): row is typeof row & {
      type: FavoriteTransactionType
    } => row.type !== 'adjustment',
  )
}

export async function createFavoriteRecord(data: FavoriteFormValues) {
  await validateReferences(data)

  const duplicate = (
    await db
      .select({
        id: transactionFavorites.id,
      })
      .from(transactionFavorites)
      .where(
        and(
          eq(transactionFavorites.isActive, true),
          ilike(transactionFavorites.title, data.title.trim()),
          eq(transactionFavorites.type, data.type),
          eq(transactionFavorites.accountId, data.accountId),
        ),
      )
      .limit(1)
  ).at(0)

  if (duplicate) {
    throw new Error(
      'Favorit dengan nama, jenis, dan account yang sama sudah tersedia',
    )
  }

  const created = (
    await db
      .insert(transactionFavorites)
      .values({
        title: data.title,
        type: data.type,
        amount: data.amount,
        accountId: data.accountId,

        categoryId:
          data.type === 'expense' || data.type === 'income'
            ? data.categoryId
            : null,

        targetAccountId:
          data.type === 'transfer' || data.type === 'investment'
            ? data.targetAccountId
            : null,

        note: data.note || null,
      })
      .returning({
        id: transactionFavorites.id,
        title: transactionFavorites.title,
      })
  ).at(0)

  if (!created) {
    throw new Error('Gagal membuat favorit')
  }

  return created
}

export async function updateFavoriteRecord(data: UpdateFavoriteValues) {
  const existing = (
    await db
      .select({
        id: transactionFavorites.id,
      })
      .from(transactionFavorites)
      .where(
        and(
          eq(transactionFavorites.id, data.id),
          eq(transactionFavorites.isActive, true),
        ),
      )
      .limit(1)
  ).at(0)

  if (!existing) {
    throw new Error('Favorit tidak ditemukan')
  }

  await validateReferences(data)

  const updated = (
    await db
      .update(transactionFavorites)
      .set({
        title: data.title,
        type: data.type,
        amount: data.amount,
        accountId: data.accountId,

        categoryId:
          data.type === 'expense' || data.type === 'income'
            ? data.categoryId
            : null,

        targetAccountId:
          data.type === 'transfer' || data.type === 'investment'
            ? data.targetAccountId
            : null,

        note: data.note || null,
        updatedAt: new Date(),
      })
      .where(eq(transactionFavorites.id, data.id))
      .returning({
        id: transactionFavorites.id,
        title: transactionFavorites.title,
      })
  ).at(0)

  if (!updated) {
    throw new Error('Gagal memperbarui favorit')
  }

  return updated
}

export async function deactivateFavoriteRecord(id: string) {
  const deactivated = (
    await db
      .update(transactionFavorites)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(transactionFavorites.id, id))
      .returning({
        id: transactionFavorites.id,
      })
  ).at(0)

  if (!deactivated) {
    throw new Error('Favorit tidak ditemukan')
  }

  return deactivated
}
