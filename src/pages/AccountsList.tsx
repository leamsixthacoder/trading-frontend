import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccounts } from '../context/AccountsContext'
import { formatMoney } from '../lib/format'
import { Card } from '../components/ui/Card'
import { StatCardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { AccountTypeBadge, StatusBadge } from '../components/ui/Badge'
import { AddAccountForm } from '../components/AddAccountForm'

interface AccountsListProps {
  title: string
  accountTypes: string[]
  basePath: string
  emptyDescription: string
  allowAdd?: boolean
}

export function AccountsList({ title, accountTypes, basePath, emptyDescription, allowAdd }: AccountsListProps) {
  const navigate = useNavigate()
  const { accounts: data, loading, error, refetch } = useAccounts()

  const filtered = useMemo(
    () => (data ?? []).filter((a) => accountTypes.includes(a.account_type)),
    [data, accountTypes],
  )

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-medium text-text-primary">{title}</h1>
        {allowAdd && <AddAccountForm allowedTypes={accountTypes} onCreated={() => refetch()} />}
      </div>

      {error && <ErrorState message="Couldn't load accounts — check your connection and retry." onRetry={refetch} />}

      {!error && loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!error && !loading && filtered.length === 0 && (
        <Card>
          <EmptyState title="No accounts yet" description={emptyDescription} />
        </Card>
      )}

      {!error && !loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <button key={a.id} type="button" onClick={() => navigate(`${basePath}/${a.id}`)} className="text-left">
              <Card className="hover:border-accent-violet transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-primary">{a.label}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <AccountTypeBadge accountType={a.account_type} />
                    <StatusBadge status={a.status} />
                  </div>
                </div>
                <div className="font-mono tabular-nums text-2xl font-medium mt-3 text-text-primary">
                  {formatMoney(a.capital_base)}
                </div>
                <div className="text-sm text-text-muted mt-1">Capital base</div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
