import type { PositionSizingMethod } from '../../api'

export const SIZING_METHOD_LABELS: Record<PositionSizingMethod, string> = {
  fixed_contracts: 'Fixed contracts',
  percent_capital: '% of capital',
  percent_risk: '% risk per trade',
  custom: 'Custom',
}

export function buildSizingParameters(method: PositionSizingMethod, value: string): Record<string, unknown> {
  if (method === 'custom') return { notes: value.trim() }
  const key = method === 'fixed_contracts' ? 'contracts' : 'percent'
  return { [key]: Number(value) }
}

export function describeSizingParameters(method: string, parameters: Record<string, unknown>): string {
  if (method === 'custom') return String(parameters.notes ?? '')
  if ('contracts' in parameters) return `${parameters.contracts} contracts`
  if ('percent' in parameters) return `${parameters.percent}%`
  return JSON.stringify(parameters)
}
