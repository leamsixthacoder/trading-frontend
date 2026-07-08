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

export interface DashboardAccountRow {
  account_id: string
  label: string
  account_type: string
  status: string
  current_balance: string
  today_pnl: string
}

export interface DashboardSummary {
  accounts: DashboardAccountRow[]
  total_capital: string
  total_pnl_today: string
}

export type JournalEntryType = 'daily_log' | 'meeting_note' | 'general'

export interface JournalEntry {
  id: string
  account_id: string | null
  entry_date: string
  entry_type: JournalEntryType
  content: string
  created_at: string
}

export interface JournalEntryInput {
  account_id?: string | null
  entry_date: string
  entry_type: JournalEntryType
  content: string
}

export interface PnlBySetup {
  account_id: string
  setup_tag: string
  total_pnl: string
  trade_count: number
  avg_pnl: string | null
  win_rate: number | null
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) {
    throw new Error(`${path} failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
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

export function getDashboardSummary(): Promise<DashboardSummary> {
  return getJson('/dashboard/summary')
}

export function listJournalEntries(): Promise<JournalEntry[]> {
  return getJson('/journal-entries')
}

export function createJournalEntry(entry: JournalEntryInput): Promise<JournalEntry> {
  return postJson('/journal-entries', entry)
}

export function getSetupPerformance(): Promise<PnlBySetup[]> {
  return getJson('/analytics/pnl-by-setup')
}
