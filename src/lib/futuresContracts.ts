export interface FuturesContract {
  symbol: string
  name: string
  exchange: string
}

// Small starter list of commonly-traded contracts — expand as needed (spec §8), not an exhaustive CME/CBOT/COMEX/NYMEX catalog.
export const FUTURES_CONTRACTS: FuturesContract[] = [
  { symbol: 'MNQ', name: 'Micro E-mini Nasdaq-100', exchange: 'CME' },
  { symbol: 'NQ', name: 'E-mini Nasdaq-100', exchange: 'CME' },
  { symbol: 'MES', name: 'Micro E-mini S&P 500', exchange: 'CME' },
  { symbol: 'ES', name: 'E-mini S&P 500', exchange: 'CME' },
  { symbol: 'MYM', name: 'Micro E-mini Dow', exchange: 'CBOT' },
  { symbol: 'YM', name: 'E-mini Dow', exchange: 'CBOT' },
  { symbol: 'M2K', name: 'Micro E-mini Russell 2000', exchange: 'CME' },
  { symbol: 'RTY', name: 'E-mini Russell 2000', exchange: 'CME' },
  { symbol: 'CL', name: 'Crude Oil', exchange: 'NYMEX' },
  { symbol: 'MCL', name: 'Micro Crude Oil', exchange: 'NYMEX' },
  { symbol: 'NG', name: 'Natural Gas', exchange: 'NYMEX' },
  { symbol: 'GC', name: 'Gold', exchange: 'COMEX' },
  { symbol: 'MGC', name: 'Micro Gold', exchange: 'COMEX' },
  { symbol: 'SI', name: 'Silver', exchange: 'COMEX' },
  { symbol: 'ZB', name: '30-Year U.S. Treasury Bond', exchange: 'CBOT' },
  { symbol: 'ZN', name: '10-Year U.S. Treasury Note', exchange: 'CBOT' },
]

export function searchFuturesContracts(query: string): FuturesContract[] {
  const q = query.trim().toLowerCase()
  if (!q) return FUTURES_CONTRACTS
  return FUTURES_CONTRACTS.filter(
    (c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
  )
}
