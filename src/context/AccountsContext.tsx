import { createContext, useContext, type ReactNode } from 'react'
import { listAccounts, type Account } from '../api'
import { useApi } from '../hooks/useApi'

interface AccountsContextValue {
  accounts: Account[] | null
  loading: boolean
  error: string | null
  refetch: () => void
}

const AccountsContext = createContext<AccountsContextValue | null>(null)

export function AccountsProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, refetch } = useApi(listAccounts, [])
  return (
    <AccountsContext.Provider value={{ accounts: data, loading, error, refetch }}>
      {children}
    </AccountsContext.Provider>
  )
}

export function useAccounts(): AccountsContextValue {
  const ctx = useContext(AccountsContext)
  if (!ctx) throw new Error('useAccounts must be used within an AccountsProvider')
  return ctx
}
