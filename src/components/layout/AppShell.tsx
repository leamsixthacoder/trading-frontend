import { Outlet } from 'react-router-dom'
import { TopNav } from './TopNav'
import { EquityTape } from './EquityTape'
import { AccountsProvider } from '../../context/AccountsContext'

export function AppShell() {
  return (
    <AccountsProvider>
      <div className="flex min-h-svh flex-col bg-bg text-text-primary">
        <TopNav />
        <EquityTape />
        <main className="flex-1 px-4 py-6 md:px-6">
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </AccountsProvider>
  )
}
