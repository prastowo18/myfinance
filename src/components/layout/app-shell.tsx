import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

type AppShellProps = {
  children: ReactNode
}

const desktopNavigation = [
  {
    to: '/',
    label: 'Dashboard',
  },
  {
    to: '/transactions',
    label: 'Transaksi',
  },
  {
    to: '/accounts',
    label: 'Account',
  },
  {
    to: '/categories',
    label: 'Kategori',
  },
  {
    to: '/reports',
    label: 'Laporan',
  },
] as const

const mobileNavigation = [
  {
    to: '/',
    label: 'Dashboard',
  },
  {
    to: '/transactions',
    label: 'Transaksi',
  },
  {
    to: '/accounts',
    label: 'Account',
  },
  {
    to: '/reports',
    label: 'Laporan',
  },
] as const

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-background md:block">
        <div className="flex h-16 items-center border-b px-6">
          <Link to="/" className="text-lg font-bold">
            MyFinance
          </Link>
        </div>

        <nav className="space-y-1 p-4">
          {desktopNavigation.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{
                exact: item.to === '/',
              }}
              className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeProps={{
                className:
                  'block rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <p className="text-xs text-muted-foreground">Personal Finance</p>
        </div>
      </aside>

      <div className="md:pl-64">
        <div className="min-h-screen pb-20 md:pb-0">{children}</div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background md:hidden">
        <div className="grid grid-cols-4">
          {mobileNavigation.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{
                exact: item.to === '/',
              }}
              className="flex min-h-16 items-center justify-center px-2 text-xs font-medium text-muted-foreground"
              activeProps={{
                className:
                  'flex min-h-16 items-center justify-center bg-accent px-2 text-xs font-semibold text-accent-foreground',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
