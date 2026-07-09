import { Input } from './ui/form'

interface InstrumentPickerProps {
  value: string
  onChange: (symbol: string) => void
  placeholder?: string
  className?: string
}

// Stocks/ETFs only for now — free text since no symbol lookup API is wired up yet (spec §8 fallback).
export function InstrumentPicker({ value, onChange, placeholder = 'Symbol', className }: InstrumentPickerProps) {
  return (
    <Input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      className={className}
      aria-label="Instrument symbol"
    />
  )
}
