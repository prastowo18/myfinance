import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import { categories } from '../src/db/schema'

config({ path: '.env.local' })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL belum tersedia')
}

const sql = neon(databaseUrl)
const db = drizzle(sql)

async function seed() {
  await db.insert(categories).values([
    {
      name: 'Makanan',
      type: 'expense',
    },
    {
      name: 'Transportasi',
      type: 'expense',
    },
    {
      name: 'Belanja',
      type: 'expense',
    },
    {
      name: 'Tagihan',
      type: 'expense',
    },
    {
      name: 'Gaji',
      type: 'income',
    },
    {
      name: 'Bonus',
      type: 'income',
    },
    {
      name: 'Pendapatan Lain',
      type: 'income',
    },
  ])

  console.log('Seed kategori selesai')
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
