import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import { accounts } from '../src/db/schema'

config({ path: '.env.local' })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL belum tersedia')
}

const sql = neon(databaseUrl)
const db = drizzle(sql)

async function seed() {
  await db.insert(accounts).values([
    {
      name: 'BCA',
      type: 'bank',
      initialBalance: 0,
    },
    {
      name: 'Cash',
      type: 'cash',
      initialBalance: 0,
    },
    {
      name: 'GoPay',
      type: 'ewallet',
      initialBalance: 0,
    },
    {
      name: 'Investasi Saham',
      type: 'investment',
      initialBalance: 0,
    },
  ])

  console.log('Seed account selesai')
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
