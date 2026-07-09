import { useState } from 'react'
import { Input } from './ui/form'
import { searchFuturesContracts } from '../lib/futuresContracts'

export type InstrumentAssetClass = 'equity' | 'futures'
type PickerKind = 'stock' | 'futures'

interface InstrumentPickerProps {
  value: string
  onChange: (symbol: string, assetClass: InstrumentAssetClass) => void
  mode?: PickerKind | 'both'
  placeholder?: string
  className?: string
}

// Stocks/ETFs: free text since no symbol lookup API is wired up yet (spec §8 fallback).
// Futures: small local static list (see lib/futuresContracts.ts), searchable by symbol or name.
export function InstrumentPicker({
  value,
  onChange,
  mode = 'both',
  placeholder,
  className = '',
}: InstrumentPickerProps) {
  const [kind, setKind] = useState<PickerKind>(mode === 'futures' ? 'futures' : 'stock')
  const [open, setOpen] = useState(false)
  const activeKind = mode === 'both' ? kind : mode

  const matches = searchFuturesContracts(value).slice(0, 8)

  return (
    <div className={`relative ${className}`}>
      {mode === 'both' && (
        <div className="flex gap-2 mb-1">
          <button
            type="button"
            onClick={() => setKind('stock')}
            className={`text-xs ${activeKind === 'stock' ? 'text-accent-violet' : 'text-text-muted'}`}
          >
            Stock/ETF
          </button>
          <button
            type="button"
            onClick={() => setKind('futures')}
            className={`text-xs ${activeKind === 'futures' ? 'text-accent-violet' : 'text-text-muted'}`}
          >
            Futures
          </button>
        </div>
      )}

      {activeKind === 'stock' ? (
        <Input
          type="text"
          placeholder={placeholder ?? 'Symbol'}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase(), 'equity')}
          aria-label="Instrument symbol"
          className="w-full"
        />
      ) : (
        <>
          <Input
            type="text"
            placeholder={placeholder ?? 'Contract (e.g. MNQ)'}
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase(), 'futures')}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-label="Futures contract"
            className="w-full"
          />
          {open && matches.length > 0 && (
            <ul
              role="listbox"
              className="absolute z-10 mt-1 w-64 max-h-64 overflow-y-auto rounded-md border border-border bg-surface-raised py-1 shadow-lg"
            >
              {matches.map((c) => (
                <li key={c.symbol}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(c.symbol, 'futures')
                      setOpen(false)
                    }}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-text-primary hover:bg-surface"
                  >
                    <span>
                      <span className="font-mono">{c.symbol}</span>{' '}
                      <span className="text-text-muted">{c.name}</span>
                    </span>
                    <span className="text-xs text-text-muted">{c.exchange}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
