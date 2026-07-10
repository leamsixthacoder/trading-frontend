import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  acknowledgeRiskAlert,
  getDashboardSummary,
  getSetupPerformance,
  listAccounts,
  listRiskAlerts,
  listJournalEntries,
} from '../api'
import { useApi } from '../hooks/useApi'
import { useAggregateEquity } from '../lib/equity'
import { formatDate, formatMoney, formatSigned, signClass, signOf, toNumber } from '../lib/format'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { StatCardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { AccountTypeBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/form'
import { LineAreaChart } from '../components/charts/LineAreaChart'
import { JournalSection } from '../components/JournalSection'
import { SetupPerformance } from '../components/SetupPerformance'
import { RuleViolationsSection } from '../components/RuleViolationsSection'

function routeFor(accountType: string, accountId: string): string {
  if (accountType === 'personal_live') return `/live/${accountId}`
  if (accountType === 'personal_portfolio') return `/portfolio/${accountId}`
  return `/funded/${accountId}`
}

export function Dashboard() {
  const navigate = useNavigate()
  const summary = useApi(getDashboardSummary, [])
  const accountsApi = useApi(listAccounts, [])
  const alerts = useApi(() => listRiskAlerts(false), [])
  const setupPerf = useApi(getSetupPerformance, [])
  const journal = useApi(listJournalEntries, [])
  const equity = useAggregateEquity(accountsApi.data)

  const [journalEntries, setJournalEntries] = useState(journal.data ?? [])
  useEffect(() => {
    if (journal.data) setJournalEntries(journal.data)
  }, [journal.data])

  const totals = useMemo(() => {
    if (!summary.data) return null
    const totalBalance = summary.data.accounts.reduce((sum, a) => sum + toNumber(a.current_balance), 0)
    const atRisk = new Set(alerts.data?.map((al) => al.account_id) ?? []).size
    return {
      totalCapital: toNumber(summary.data.total_capital),
      totalBalance,
      todayPnl: toNumber(summary.data.total_pnl_today),
      atRisk,
    }
  }, [summary.data, alerts.data])

  const accountsById = useMemo(
    () => new Map((accountsApi.data ?? []).map((a) => [a.id, a])),
    [accountsApi.data],
  )

  async function handleAcknowledge(alertId: string) {
    await acknowledgeRiskAlert(alertId)
    alerts.refetch()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium text-text-primary">Dashboard</h1>

      {summary.error && <ErrorState message="Couldn't load dashboard summary — check your connection and retry." onRetry={summary.refetch} />}

      {!summary.error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summary.loading || !totals ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard label="Total Capital" value={formatMoney(totals.totalCapital)} />
              <StatCard label="Total Balance" value={formatMoney(totals.totalBalance)} />
              <StatCard
                label="Today's P&L"
                value={formatSigned(totals.todayPnl)}
                sign={signOf(totals.todayPnl)}
              />
              <StatCard
                label="Accounts at Risk"
                value={totals.atRisk}
                sign={totals.atRisk > 0 ? 'negative' : 'neutral'}
              />
            </>
          )}
        </div>
      )}

      <div>
        <h2 className="text-sm text-text-muted mb-3">Accounts</h2>
        {summary.loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : summary.data && summary.data.accounts.length === 0 ? (
          <Card>
            <EmptyState
              title="No accounts yet"
              description="Seed an account on the backend to see it appear here."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summary.data?.accounts.map((a) => {
              const pnl = toNumber(a.today_pnl)
              return (
                <button
                  key={a.account_id}
                  type="button"
                  onClick={() => navigate(routeFor(a.account_type, a.account_id))}
                  className="text-left"
                >
                  <Card className="hover:border-accent-violet transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">{a.label}</span>
                      <AccountTypeBadge accountType={a.account_type} />
                    </div>
                    <div className="font-mono tabular-nums text-2xl font-medium mt-3 text-text-primary">
                      {formatMoney(a.current_balance)}
                    </div>
                    <div className={`font-mono tabular-nums text-sm mt-1 ${signClass[signOf(pnl)]}`}>
                      {formatSigned(pnl)} today
                    </div>
                  </Card>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <LineAreaChart
        title="Aggregate Equity"
        data={equity.data}
        loading={equity.loading || accountsApi.loading}
        emptyMessage="Combined balance history appears here once accounts have closed trades."
      />

      <RuleViolationsSection />

      <Card>
        <h2 className="text-sm text-text-muted mb-3">Recent Risk Alerts</h2>
        {alerts.loading && <div className="text-sm text-text-muted">Loading…</div>}
        {alerts.error && (
          <ErrorState message="Couldn't load risk alerts — check your connection and retry." onRetry={alerts.refetch} />
        )}
        {!alerts.loading && !alerts.error && (alerts.data?.length ?? 0) === 0 && (
          <EmptyState title="No unacknowledged risk alerts" description="You're clear — nothing needs review right now." />
        )}
        {!alerts.loading && !alerts.error && alerts.data && alerts.data.length > 0 && (
          <ul className="divide-y divide-border">
            {alerts.data.slice(0, 5).map((al) => (
              <li key={al.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <div className="text-text-primary">
                    {accountsById.get(al.account_id)?.label ?? al.account_id}
                  </div>
                  <div className="text-text-muted font-mono tabular-nums">
                    actual {al.actual_value} / threshold {al.threshold_value} · {formatDate(al.triggered_at)}
                  </div>
                </div>
                <Button variant="secondary" onClick={() => handleAcknowledge(al.id)}>
                  Acknowledge
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        {setupPerf.error ? (
          <>
            <h2 className="text-sm text-text-muted mb-3">Setup Performance</h2>
            <ErrorState message="Couldn't load setup performance — check your connection and retry." onRetry={setupPerf.refetch} />
          </>
        ) : (
          <SetupPerformance rows={setupPerf.data ?? []} />
        )}
      </Card>

      <Card>
        {journal.error ? (
          <>
            <h2 className="text-sm text-text-muted mb-3">Journal</h2>
            <ErrorState message="Couldn't load journal entries — check your connection and retry." onRetry={journal.refetch} />
          </>
        ) : (
          <JournalSection
            entries={journalEntries}
            onCreated={(entry) => setJournalEntries((prev) => [entry, ...prev])}
          />
        )}
      </Card>
    </div>
  )
}
