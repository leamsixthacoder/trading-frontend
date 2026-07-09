import { useEffect, useState } from 'react'
import { listAccounts, listHoldings } from '../api'
import { useApi } from '../hooks/useApi'
import { InvestmentsSection } from '../components/InvestmentsSection'
import { Card } from '../components/ui/Card'
import { ErrorState } from '../components/ui/ErrorState'

export function Portfolio() {
  const accounts = useApi(listAccounts, [])
  const holdings = useApi(listHoldings, [])

  const [holdingState, setHoldingState] = useState(holdings.data ?? [])
  useEffect(() => {
    if (holdings.data) setHoldingState(holdings.data)
  }, [holdings.data])

  const portfolioAccounts = (accounts.data ?? []).filter((a) => a.account_type === 'personal_portfolio')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium text-text-primary">Portfolio</h1>
      <Card className="flex flex-col items-center gap-2 py-10 text-center">
        <span className="inline-flex items-center rounded-full border border-accent-violet/30 bg-accent-violet/10 px-2.5 py-0.5 text-xs font-medium text-accent-violet">
          Full module coming in a follow-up pass
        </span>
        <p className="max-w-md text-sm text-text-muted">
          Holdings table, allocation donut, and Quarter/Year/4-Year/5-Year returns (spec §5) land once a live/delayed
          price source is decided. Holdings entry already works below.
        </p>
      </Card>
      {holdings.error || accounts.error ? (
        <Card>
          <ErrorState
            message="Couldn't load holdings — check your connection and retry."
            onRetry={() => {
              holdings.refetch()
              accounts.refetch()
            }}
          />
        </Card>
      ) : (
        <InvestmentsSection
          holdings={holdingState}
          portfolioAccounts={portfolioAccounts}
          onCreated={(holding) => setHoldingState((prev) => [holding, ...prev])}
        />
      )}
    </div>
  )
}
