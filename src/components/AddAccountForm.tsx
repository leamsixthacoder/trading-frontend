import { useState, type FormEvent } from 'react'
import { createAccount, type Account } from '../api'
import { accountTypeLabels } from './ui/Badge'
import { Card } from './ui/Card'
import { Button, Input, Select } from './ui/form'
import { ErrorState } from './ui/ErrorState'

interface AddAccountFormProps {
  allowedTypes: string[]
  onCreated: (account: Account) => void
}

export function AddAccountForm({ allowedTypes, onCreated }: AddAccountFormProps) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [accountType, setAccountType] = useState(allowedTypes[0])
  const [capitalBase, setCapitalBase] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setLabel('')
    setAccountType(allowedTypes[0])
    setCapitalBase('')
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const capital = Number(capitalBase)
    if (!label.trim()) {
      setError('Label is required')
      return
    }
    if (!capitalBase || Number.isNaN(capital) || capital <= 0) {
      setError('Capital base must be a positive number')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const created = await createAccount({ label: label.trim(), account_type: accountType, capital_base: capital })
      onCreated(created)
      reset()
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create account')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        + Add Account
      </Button>
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Label</label>
          <Input
            type="text"
            placeholder="e.g. Lucid Flex #4"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-48"
            autoFocus
          />
        </div>

        {allowedTypes.length > 1 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">Type</label>
            <Select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
              {allowedTypes.map((type) => (
                <option key={type} value={type}>
                  {accountTypeLabels[type] ?? type}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Capital base</label>
          <Input
            type="number"
            step="0.01"
            placeholder="$ amount"
            value={capitalBase}
            onChange={(e) => setCapitalBase(e.target.value)}
            className="w-32"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              reset()
              setOpen(false)
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
      {error && <ErrorState message={error} />}
    </Card>
  )
}
