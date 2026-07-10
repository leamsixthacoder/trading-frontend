import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  addGroupMember,
  deleteAccountGroup,
  getAccountBalance,
  listAccountGroups,
  listAccounts,
  listGroupAccounts,
  removeGroupMember,
  updateAccountGroup,
  type Account,
} from '../api'
import { useApi } from '../hooks/useApi'
import { useAggregateEquity } from '../lib/equity'
import { formatMoney, toNumber } from '../lib/format'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { StatCardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { AccountTypeBadge, StatusBadge } from '../components/ui/Badge'
import { Button, Input, Select } from '../components/ui/form'
import { LineAreaChart } from '../components/charts/LineAreaChart'

function routeFor(accountType: string, accountId: string): string {
  if (accountType === 'personal_live') return `/live/${accountId}`
  if (accountType === 'personal_portfolio') return `/portfolio/${accountId}`
  return `/funded/${accountId}`
}

interface BalanceTotals {
  capitalBase: number
  tradePnl: number
  allocations: number
  balance: number
}

function useAggregateBalance(accounts: Account[] | null) {
  const [state, setState] = useState<{ loading: boolean; totals: BalanceTotals | null }>({
    loading: true,
    totals: null,
  })

  useEffect(() => {
    if (!accounts) return
    if (accounts.length === 0) {
      setState({ loading: false, totals: { capitalBase: 0, tradePnl: 0, allocations: 0, balance: 0 } })
      return
    }
    let cancelled = false
    setState((s) => ({ ...s, loading: true }))
    Promise.all(accounts.map((a) => getAccountBalance(a.id)))
      .then((results) => {
        if (cancelled) return
        const totals = results.reduce<BalanceTotals>(
          (acc, b) => ({
            capitalBase: acc.capitalBase + toNumber(b.capital_base),
            tradePnl: acc.tradePnl + toNumber(b.total_trade_pnl),
            allocations: acc.allocations + toNumber(b.total_allocations),
            balance: acc.balance + toNumber(b.current_balance),
          }),
          { capitalBase: 0, tradePnl: 0, allocations: 0, balance: 0 },
        )
        setState({ loading: false, totals })
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, totals: null })
      })
    return () => {
      cancelled = true
    }
  }, [accounts])

  return state
}

export function GroupDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const groups = useApi(listAccountGroups, [])
  const members = useApi(() => listGroupAccounts(id), [id])
  const allAccounts = useApi(listAccounts, [])

  const group = groups.data?.find((g) => g.id === id)
  const balance = useAggregateBalance(members.data)
  const equity = useAggregateEquity(members.data)

  const [renaming, setRenaming] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [renameError, setRenameError] = useState<string | null>(null)
  const [renameSubmitting, setRenameSubmitting] = useState(false)

  const [addAccountId, setAddAccountId] = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const [rowBusy, setRowBusy] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function startRename() {
    if (!group) return
    setNameValue(group.name)
    setRenaming(true)
    setRenameError(null)
  }

  async function handleRename(e: FormEvent) {
    e.preventDefault()
    if (!nameValue.trim()) return
    setRenameSubmitting(true)
    setRenameError(null)
    try {
      await updateAccountGroup(id, { name: nameValue.trim() })
      await groups.refetch()
      setRenaming(false)
    } catch (e) {
      setRenameError(e instanceof Error ? e.message : 'Failed to rename group')
    } finally {
      setRenameSubmitting(false)
    }
  }

  async function handleAddMember(e: FormEvent) {
    e.preventDefault()
    if (!addAccountId) return
    setAddSubmitting(true)
    setAddError(null)
    try {
      await addGroupMember(id, addAccountId)
      setAddAccountId('')
      await members.refetch()
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add account')
    } finally {
      setAddSubmitting(false)
    }
  }

  async function handleRemoveMember(accountId: string) {
    if (!window.confirm('Remove this account from the group?')) return
    setRowBusy(accountId)
    try {
      await removeGroupMember(id, accountId)
      await members.refetch()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Failed to remove account')
    } finally {
      setRowBusy(null)
    }
  }

  async function handleDeleteGroup() {
    if (!window.confirm(`Delete the group "${group?.name}"? This does not delete any accounts.`)) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteAccountGroup(id)
      navigate('/groups')
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete group')
      setDeleting(false)
    }
  }

  const availableAccounts = (allAccounts.data ?? []).filter(
    (a) => !(members.data ?? []).some((m) => m.id === a.id),
  )

  if (groups.error) {
    return <ErrorState message="Couldn't load groups — check your connection and retry." onRetry={groups.refetch} />
  }

  if (groups.loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!group) {
    return <EmptyState title="Group not found" description="It may have been deleted or the link is out of date." />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {renaming ? (
            <form onSubmit={handleRename} className="flex items-center gap-2">
              <Input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="text-xl"
                autoFocus
              />
              <Button type="submit" variant="secondary" disabled={renameSubmitting}>
                {renameSubmitting ? 'Saving…' : 'Save'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setRenaming(false)}>
                Cancel
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-medium text-text-primary">{group.name}</h1>
              <button
                type="button"
                onClick={startRename}
                className="text-xs text-accent-violet hover:underline"
              >
                Rename
              </button>
            </div>
          )}
          {renameError && <ErrorState message={renameError} />}
          <div className="text-sm text-text-muted mt-1">
            {(members.data ?? []).length} account{(members.data ?? []).length === 1 ? '' : 's'}
          </div>
        </div>
        <Button variant="secondary" onClick={handleDeleteGroup} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete group'}
        </Button>
      </div>
      {deleteError && <ErrorState message={deleteError} />}

      {members.error ? (
        <ErrorState message="Couldn't load this group's accounts — check your connection and retry." onRetry={members.refetch} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {balance.loading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard label="Combined Balance" value={formatMoney(balance.totals?.balance ?? 0)} />
                <StatCard label="Combined Capital Base" value={formatMoney(balance.totals?.capitalBase ?? 0)} />
                <StatCard label="Combined Trade P&L" value={formatMoney(balance.totals?.tradePnl ?? 0)} />
                <StatCard label="Combined Allocations" value={formatMoney(balance.totals?.allocations ?? 0)} />
              </>
            )}
          </div>

          <LineAreaChart
            title="Combined Equity"
            data={equity.data}
            loading={equity.loading || members.loading}
            emptyMessage="Add accounts to this group to see combined equity here."
            variant="area"
          />

          <Card>
            <div className="text-sm text-text-muted mb-3">Accounts in this group</div>

            <form onSubmit={handleAddMember} className="flex flex-wrap items-center gap-2 mb-4">
              <Select value={addAccountId} onChange={(e) => setAddAccountId(e.target.value)}>
                <option value="">Add an account…</option>
                {availableAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="secondary" disabled={addSubmitting || !addAccountId}>
                {addSubmitting ? 'Adding…' : 'Add'}
              </Button>
            </form>
            {addError && <ErrorState message={addError} />}

            {(members.data ?? []).length === 0 ? (
              <EmptyState title="No accounts in this group yet" description="Add one above." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-text-muted">
                      <th className="py-2 font-normal">Account</th>
                      <th className="py-2 font-normal">Type</th>
                      <th className="py-2 font-normal">Status</th>
                      <th className="py-2 font-normal">Capital base</th>
                      <th className="py-2 font-normal">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono tabular-nums">
                    {(members.data ?? []).map((a) => (
                      <tr key={a.id} className="border-b border-border last:border-0">
                        <td className="py-2 font-sans">
                          <button
                            type="button"
                            onClick={() => navigate(routeFor(a.account_type, a.id))}
                            className="text-accent-violet hover:underline"
                          >
                            {a.label}
                          </button>
                        </td>
                        <td className="py-2 font-sans">
                          <AccountTypeBadge accountType={a.account_type} />
                        </td>
                        <td className="py-2 font-sans">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="py-2">{formatMoney(a.capital_base)}</td>
                        <td className="py-2 font-sans">
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(a.id)}
                            disabled={rowBusy === a.id}
                            className="text-xs text-accent-red hover:underline disabled:opacity-50"
                          >
                            {rowBusy === a.id ? 'Removing…' : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
