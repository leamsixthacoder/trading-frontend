import type { ConditionGroup, RuleCondition } from '../../api'
import { Button, Input, Select } from '../ui/form'
import { EMPTY_CONDITION } from './conditions'

const OPERATORS = ['>', '<', '>=', '<=', '=', 'crosses above', 'crosses below']
const INDICATOR_SUGGESTIONS = ['RSI', 'SMA', 'EMA', 'Price', 'MACD', 'Volume', 'ATR', 'VWAP', 'Stochastic']

interface ConditionBuilderProps {
  label: string
  datalistId: string
  value: ConditionGroup
  onChange: (group: ConditionGroup) => void
}

export function ConditionBuilder({ label, datalistId, value, onChange }: ConditionBuilderProps) {
  function updateCondition(index: number, patch: Partial<RuleCondition>) {
    const conditions = value.conditions.map((c, i) => (i === index ? { ...c, ...patch } : c))
    onChange({ ...value, conditions })
  }

  function addCondition() {
    onChange({ ...value, conditions: [...value.conditions, { ...EMPTY_CONDITION }] })
  }

  function removeCondition(index: number) {
    onChange({ ...value, conditions: value.conditions.filter((_, i) => i !== index) })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-xs text-text-muted">{label}</div>
        {value.conditions.length > 1 && (
          <div className="flex rounded-md border border-border p-0.5">
            {(['AND', 'OR'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onChange({ ...value, logic: l })}
                className={`rounded px-2 py-0.5 text-xs transition-colors ${
                  value.logic === l ? 'bg-surface-raised text-text-primary' : 'text-text-muted'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      <datalist id={datalistId}>
        {INDICATOR_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div className="space-y-2">
        {value.conditions.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              type="text"
              list={datalistId}
              placeholder="Indicator (e.g. RSI)"
              value={c.indicator}
              onChange={(e) => updateCondition(i, { indicator: e.target.value })}
              className="w-36"
            />
            <Select value={c.operator} onChange={(e) => updateCondition(i, { operator: e.target.value })} className="w-32">
              {OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              step="any"
              placeholder="Value"
              value={c.value}
              onChange={(e) => updateCondition(i, { value: Number(e.target.value) })}
              className="w-24"
            />
            <button
              type="button"
              onClick={() => removeCondition(i)}
              aria-label="Remove condition"
              className="rounded-md border border-border px-2 py-1.5 text-text-muted hover:text-accent-red"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={addCondition} className="mt-2">
        + Add condition
      </Button>
    </div>
  )
}
