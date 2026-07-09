import { useNavigate } from 'react-router-dom'
import { getDashboardSummary } from '../../api'
import { useApi } from '../../hooks/useApi'
import { formatMoney, formatSignedPct, signClass, signOf, toNumber } from '../../lib/format'

function routeFor(accountType: string, accountId: string): string {
  if (accountType === 'personal_live') return `/live/${accountId}`
  if (accountType === 'personal_portfolio') return `/portfolio/${accountId}`
  return `/funded/${accountId}`
}

export function EquityTape() {
  const navigate = useNavigate()
  const { data, loading, error } = useApi(getDashboardSummary, [])

  return (
    <div
      className="h-8 border-b border-border bg-surface no-scrollbar flex items-center gap-6 overflow-x-auto px-4 text-sm"
      role="region"
      aria-label="Account equity tape"
    >
      {loading && <span className="text-text-muted whitespace-nowrap">Loading accounts…</span>}
      {error && <span className="text-accent-red whitespace-nowrap">Couldn't load accounts</span>}
      {!loading && !error && data && data.accounts.length === 0 && (
        <span className="text-text-muted whitespace-nowrap">No accounts yet</span>
      )}
      {data?.accounts.map((acct) => {
        const pnl = toNumber(acct.today_pnl)
        const balance = toNumber(acct.current_balance)
        const pctChange = balance !== 0 ? (pnl / (balance - pnl)) * 100 : 0
        const sign = signOf(pnl)
        return (
          <button
            key={acct.account_id}
            type="button"
            onClick={() => navigate(routeFor(acct.account_type, acct.account_id))}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap font-mono tabular-nums hover:text-accent-violet transition-colors"
          >
            <span className="text-text-muted font-sans">{acct.label}</span>
            <span className="text-text-primary">{formatMoney(acct.current_balance)}</span>
            <span className={signClass[sign]}>{formatSignedPct(pctChange)}</span>
          </button>
        )
      })}
    </div>
  )
}
