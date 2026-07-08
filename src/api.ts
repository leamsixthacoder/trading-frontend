const API_URL = import.meta.env.VITE_API_URL

export interface Account {
  id: string
  label: string
  account_type: string
  provider: string | null
  capital_base: string
  status: string
  created_at: string
  closed_at: string | null
}

export interface AccountBalance {
  account_id: string
  label: string
  account_type: string
  status: string
  capital_base: string
  total_trade_pnl: string
  total_allocations: string
  current_balance: string
}

export interface PortfolioBalanceByType {
  account_type: string
  account_count: number
  total_capital_base: string
  total_trade_pnl: string
  total_allocations: string
  total_balance: string
}

export interface PortfolioBalanceTotal {
  account_count: number
  total_capital_base: string
  total_trade_pnl: string
  total_allocations: string
  total_balance: string
}

export interface PortfolioBalance {
  total: PortfolioBalanceTotal
  by_type: PortfolioBalanceByType[]
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) {
    throw new Error(`${path} failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function listAccounts(): Promise<Account[]> {
  return getJson('/accounts')
}

export function getAccountBalance(accountId: string): Promise<AccountBalance> {
  return getJson(`/accounts/${accountId}/balance`)
}

export function getPortfolioBalance(): Promise<PortfolioBalance> {
  return getJson('/portfolio/balance')
}
