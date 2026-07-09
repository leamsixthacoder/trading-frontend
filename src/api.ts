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

export type StrategyStatus = 'draft' | 'backtesting' | 'validated' | 'live' | 'retired'

export interface Strategy {
  id: string
  name: string
  description: string | null
  rules: Record<string, unknown>
  status: StrategyStatus
  created_at: string
}

export interface StrategyInput {
  name: string
  description?: string | null
  rules: Record<string, unknown>
}

export interface RuleCondition {
  indicator: string
  operator: string
  value: number
}

export interface ConditionGroup {
  logic: 'AND' | 'OR'
  conditions: RuleCondition[]
}

export type PositionSizingMethod = 'fixed_contracts' | 'percent_capital' | 'percent_risk' | 'custom'

export interface PositionSizingRule {
  id: string
  strategy_id: string | null
  account_id: string | null
  method: string
  parameters: Record<string, unknown>
  created_at: string
}

export interface PositionSizingRuleInput {
  strategy_id?: string | null
  account_id?: string | null
  method: string
  parameters: Record<string, unknown>
}

export interface Backtest {
  id: string
  strategy_id: string
  period_start: string
  period_end: string
  data_source: string
  total_trades: number
  win_rate: number | null
  total_pnl: string | null
  max_drawdown: string | null
  sharpe_ratio: number | null
  parameters_snapshot: Record<string, unknown>
  created_at: string
}

export interface BacktestInput {
  period_start: string
  period_end: string
  tags?: string[]
  account_id?: string | null
}

export interface ValidationStatus {
  strategy_id: string
  has_approval: boolean
  latest_validation: { id: string; approved: boolean; created_at: string } | null
}

export interface StrategyValidation {
  id: string
  strategy_id: string
  backtest_id: string
  approved: boolean
  criteria_met: Record<string, unknown>
  notes: string | null
  created_at: string
}

export interface Holding {
  id: string
  account_id: string
  symbol: string
  quantity: string
  cost_basis: string
  acquired_date: string
  asset_class: string
  created_at: string
}

export interface HoldingInput {
  account_id: string
  symbol: string
  quantity: number
  cost_basis: number
  acquired_date: string
  asset_class?: string
}

export interface HoldingUpdate {
  quantity?: number | null
  cost_basis?: number | null
  asset_class?: string | null
}

export interface PortfolioSnapshot {
  id: string
  account_id: string
  snapshot_date: string
  total_value: string
  holdings_detail: Record<string, unknown>
  created_at: string
}

export interface PortfolioSnapshotInput {
  account_id: string
  snapshot_date: string
  total_value: number
  holdings_detail?: Record<string, unknown>
}

export interface PayoutRule {
  id: string
  account_type: string
  profit_split_pct: string
  min_payout_amount: string | null
  payout_frequency: string | null
  notes: string | null
  effective_date: string
}

export interface PayoutRuleInput {
  account_type: string
  profit_split_pct: number
  min_payout_amount?: number | null
  payout_frequency?: string | null
  notes?: string | null
}

export interface PayoutEligibility {
  account_id: string
  checked_at: string
  eligible: boolean
  computed_amount: string | null
  computed_from: Record<string, unknown>
  reason_if_ineligible: string | null
}

export interface AggregateRiskRule {
  id: string
  rule_type: string
  scope: string
  threshold: string
  active: boolean
}

export interface AggregateRiskRuleInput {
  rule_type: string
  scope: string
  threshold: number
}

export interface AggregateRiskBreach {
  rule_id: string
  rule_type: string
  scope: string
  threshold: string
  actual: string
}

export interface AggregateRiskStatus {
  total_open_risk: string
  total_daily_pnl: string
  breaches: AggregateRiskBreach[]
}

export interface EmotionalStateLog {
  id: string
  logged_at: string
  account_id: string | null
  state_tags: string[]
  intensity: number | null
  note: string | null
}

export interface EmotionalStateLogInput {
  account_id?: string | null
  state_tags?: string[]
  intensity?: number | null
  note?: string | null
}

export interface TradeReview {
  id: string
  trade_id: string | null
  what_happened: string | null
  what_went_well: string | null
  what_to_change: string | null
  created_at: string
}

export interface TradeReviewInput {
  trade_id?: string | null
  what_happened?: string | null
  what_went_well?: string | null
  what_to_change?: string | null
}

export type TradeDirection = 'long' | 'short'

export interface Trade {
  id: string
  account_id: string
  import_batch_id: string | null
  source_platform: string
  external_trade_id: string
  symbol: string
  direction: TradeDirection
  size: string
  entry_price: string
  exit_price: string | null
  entry_time: string
  exit_time: string | null
  fees: string
  pnl_gross: string | null
  pnl_net: string
  tags: string[]
  notes: string | null
  created_at: string
}

export interface TradeInput {
  account_id: string
  symbol: string
  direction: TradeDirection
  size: number
  entry_price: number
  exit_price?: number | null
  entry_time: string
  exit_time?: string | null
  fees?: number
  pnl_gross?: number | null
  tags?: string[]
  notes?: string | null
}

export type CsvPlatform = 'ninjatrader' | 'tradestation' | 'topstepx'

export interface CsvImportRowError {
  row_number: number
  field: string
  message: string
}

export interface CsvImportPreviewRow {
  row_number: number
  external_trade_id: string
  symbol: string
  direction: TradeDirection
  size: string
  entry_price: string
  exit_price: string | null
  entry_time: string
  exit_time: string | null
  fees: string
  pnl_gross: string | null
  is_duplicate: boolean
}

export interface CsvImportPreview {
  platform: string
  total_rows: number
  valid_count: number
  duplicate_count: number
  error_count: number
  rows: CsvImportPreviewRow[]
  errors: CsvImportRowError[]
}

export interface CsvImport {
  id: string
  account_id: string
  source_platform: string
  filename: string
  imported_at: string
  row_count: number
  rows_inserted: number
  rows_skipped_dupe: number
  status: string
  validation_errors: CsvImportRowError[]
}

export interface PnlByDay {
  account_id: string
  day: string
  pnl_net: string
  trade_count: number
}

export interface PnlByMonth {
  account_id: string
  month: string
  pnl_net: string
  trade_count: number
}

export interface PortfolioPnlByDay {
  day: string
  pnl_net: string
  trade_count: number
}

export interface PortfolioPnlByMonth {
  month: string
  pnl_net: string
  trade_count: number
}

export interface Allocation {
  id: string
  account_id: string
  type: string
  amount: string
  period_start: string | null
  period_end: string | null
  computed_from: Record<string, unknown>
  memo: string | null
  created_at: string
  created_by: string
}

export interface AccountStatusHistoryEntry {
  old_status: string | null
  new_status: string
  changed_at: string
  memo: string | null
}

export interface RiskAlert {
  id: string
  account_id: string
  risk_rule_id: string
  triggered_at: string
  actual_value: string
  threshold_value: string
  acknowledged: boolean
}

export type AccountRuleType = 'profit_target' | 'daily_loss_limit' | 'max_loss_limit'

export interface AccountRule {
  id: string
  account_id: string
  rule_type: AccountRuleType
  threshold: string
  created_at: string
  updated_at: string
}

export interface AccountRuleInput {
  rule_type: AccountRuleType
  threshold: number
}

export interface Quote {
  symbol: string
  price: string | null
  as_of: string | null
  error: string | null
}

export interface PortfolioReturn {
  account_id: string
  period: string
  start_date: string
  end_date: string
  start_value: string
  end_value: string
  return_pct: number
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

async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`${path} failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

async function postForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { method: 'POST', body: form })
  if (!res.ok) {
    const detail = await res
      .json()
      .then((d: { detail?: unknown }) => d.detail)
      .catch(() => null)
    throw new Error(typeof detail === 'string' ? detail : `${path} failed: ${res.status}`)
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

export function listStrategies(): Promise<Strategy[]> {
  return getJson('/strategies')
}

export function createStrategy(strategy: StrategyInput): Promise<Strategy> {
  return postJson('/strategies', strategy)
}

export function listPositionSizingRules(strategyId?: string, accountId?: string): Promise<PositionSizingRule[]> {
  return getJson(withQuery('/position-sizing-rules', { strategy_id: strategyId, account_id: accountId }))
}

export function createPositionSizingRule(rule: PositionSizingRuleInput): Promise<PositionSizingRule> {
  return postJson('/position-sizing-rules', rule)
}

export function updateStrategyStatus(id: string, status: StrategyStatus): Promise<Strategy> {
  return patchJson(`/strategies/${id}`, { status })
}

export function runBacktest(strategyId: string, input: BacktestInput): Promise<Backtest> {
  return postJson(`/strategies/${strategyId}/backtests`, input)
}

export function listBacktests(strategyId: string): Promise<Backtest[]> {
  return getJson(`/strategies/${strategyId}/backtests`)
}

export function validateStrategy(
  strategyId: string,
  backtestId: string,
  approved: boolean,
  notes?: string,
): Promise<StrategyValidation> {
  return postJson(`/strategies/${strategyId}/validate`, {
    backtest_id: backtestId,
    approved,
    notes: notes || null,
  })
}

export function getValidationStatus(strategyId: string): Promise<ValidationStatus> {
  return getJson(`/strategies/${strategyId}/validation-status`)
}

export function listHoldings(accountId?: string): Promise<Holding[]> {
  return getJson(withQuery('/holdings', { account_id: accountId }))
}

export function createHolding(holding: HoldingInput): Promise<Holding> {
  return postJson('/holdings', holding)
}

export function updateHolding(holdingId: string, patch: HoldingUpdate): Promise<Holding> {
  return patchJson(`/holdings/${holdingId}`, patch)
}

export function listPortfolioSnapshots(
  accountId: string,
  from?: string,
  to?: string,
): Promise<PortfolioSnapshot[]> {
  return getJson(withQuery('/portfolio-snapshots', { account_id: accountId, from_: from, to }))
}

export function createPortfolioSnapshot(input: PortfolioSnapshotInput): Promise<PortfolioSnapshot> {
  return postJson('/portfolio-snapshots', input)
}

export function listPayoutRules(): Promise<PayoutRule[]> {
  return getJson('/payout-rules')
}

export function createPayoutRule(rule: PayoutRuleInput): Promise<PayoutRule> {
  return postJson('/payout-rules', rule)
}

export function checkPayoutEligibility(accountId: string): Promise<PayoutEligibility> {
  return getJson(`/accounts/${accountId}/payout-eligibility`)
}

export function listAggregateRiskRules(): Promise<AggregateRiskRule[]> {
  return getJson('/aggregate-risk-rules')
}

export function createAggregateRiskRule(rule: AggregateRiskRuleInput): Promise<AggregateRiskRule> {
  return postJson('/aggregate-risk-rules', rule)
}

export function getAggregateRiskStatus(): Promise<AggregateRiskStatus> {
  return getJson('/risk/aggregate-status')
}

export function listEmotionalStateLogs(): Promise<EmotionalStateLog[]> {
  return getJson('/emotional-state-logs')
}

export function createEmotionalStateLog(log: EmotionalStateLogInput): Promise<EmotionalStateLog> {
  return postJson('/emotional-state-logs', log)
}

export function listTradeReviews(): Promise<TradeReview[]> {
  return getJson('/trade-reviews')
}

export function createTradeReview(review: TradeReviewInput): Promise<TradeReview> {
  return postJson('/trade-reviews', review)
}

export function createTrade(trade: TradeInput): Promise<Trade> {
  return postJson('/trades', trade)
}

export function listTrades(accountId?: string, symbol?: string, exitDate?: string): Promise<Trade[]> {
  return getJson(withQuery('/trades', { account_id: accountId, symbol, exit_date: exitDate }))
}

function csvImportForm(accountId: string, platform: CsvPlatform, file: File): FormData {
  const form = new FormData()
  form.append('account_id', accountId)
  form.append('platform', platform)
  form.append('file', file)
  return form
}

export function previewCsvImport(accountId: string, platform: CsvPlatform, file: File): Promise<CsvImportPreview> {
  return postForm('/csv-imports/preview', csvImportForm(accountId, platform, file))
}

export function commitCsvImport(accountId: string, platform: CsvPlatform, file: File): Promise<CsvImport> {
  return postForm('/csv-imports', csvImportForm(accountId, platform, file))
}

export function listCsvImports(accountId?: string): Promise<CsvImport[]> {
  return getJson(withQuery('/csv-imports', { account_id: accountId }))
}

function withQuery(path: string, params: Record<string, string | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `${path}?${qs}` : path
}

export function getAccountPnlDaily(
  accountId: string,
  start?: string,
  end?: string,
): Promise<PnlByDay[]> {
  return getJson(withQuery(`/accounts/${accountId}/pnl/daily`, { start, end }))
}

export function getPortfolioPnlDaily(start?: string, end?: string): Promise<PortfolioPnlByDay[]> {
  return getJson(withQuery('/portfolio/pnl/daily', { start, end }))
}

export function getPortfolioPnlMonthly(start?: string, end?: string): Promise<PortfolioPnlByMonth[]> {
  return getJson(withQuery('/portfolio/pnl/monthly', { start, end }))
}

export function getAccountPnlMonthly(accountId: string): Promise<PnlByMonth[]> {
  return getJson(`/accounts/${accountId}/pnl/monthly`)
}

export function getPayoutHistory(accountId: string): Promise<Allocation[]> {
  return getJson(`/accounts/${accountId}/payout-history`)
}

export function listAccountAllocations(accountId: string): Promise<Allocation[]> {
  return getJson(`/accounts/${accountId}/allocations`)
}

export function getStatusHistory(accountId: string): Promise<AccountStatusHistoryEntry[]> {
  return getJson(`/accounts/${accountId}/status-history`)
}

export function listRiskAlerts(acknowledged?: boolean, accountId?: string): Promise<RiskAlert[]> {
  return getJson(withQuery('/risk-alerts', { acknowledged, account_id: accountId }))
}

export function acknowledgeRiskAlert(alertId: string): Promise<RiskAlert> {
  return postJson(`/risk-alerts/${alertId}/acknowledge`, {})
}

export function getPortfolioReturns(accountId: string, period: string): Promise<PortfolioReturn> {
  return getJson(withQuery('/portfolio/returns', { account_id: accountId, period }))
}

export function listAccountRules(accountId: string): Promise<AccountRule[]> {
  return getJson(`/accounts/${accountId}/rules`)
}

export function createAccountRule(accountId: string, input: AccountRuleInput): Promise<AccountRule> {
  return postJson(`/accounts/${accountId}/rules`, input)
}

export function updateAccountRule(accountId: string, ruleId: string, threshold: number): Promise<AccountRule> {
  return patchJson(`/accounts/${accountId}/rules/${ruleId}`, { threshold })
}

export function getQuotes(symbols: string[]): Promise<Quote[]> {
  if (symbols.length === 0) return Promise.resolve([])
  return getJson(withQuery('/quotes', { symbols: symbols.join(',') }))
}
