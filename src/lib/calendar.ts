export interface CalendarDay {
  date: Date
  key: string
  inCurrentMonth: boolean
}

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function monthWeeks(year: number, monthIndex0: number): CalendarDay[][] {
  const start = new Date(year, monthIndex0, 1)
  start.setDate(start.getDate() - start.getDay())

  const lastOfMonth = new Date(year, monthIndex0 + 1, 0)
  const end = new Date(lastOfMonth)
  end.setDate(end.getDate() + (6 - end.getDay()))

  const weeks: CalendarDay[][] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    const week: CalendarDay[] = []
    for (let i = 0; i < 7; i++) {
      week.push({ date: new Date(cursor), key: toKey(cursor), inCurrentMonth: cursor.getMonth() === monthIndex0 })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

export function monthLabel(year: number, monthIndex0: number): string {
  return new Date(year, monthIndex0, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const GREEN: [number, number, number] = [62, 207, 142]
const RED: [number, number, number] = [240, 97, 107]

export function pnlCellStyle(pnl: number, maxAbs: number): { backgroundColor: string } {
  if (pnl === 0 || maxAbs === 0) {
    return { backgroundColor: 'rgba(126, 143, 135, 0.08)' }
  }
  const ratio = Math.min(Math.abs(pnl) / maxAbs, 1)
  const alpha = 0.14 + ratio * 0.56
  const [r, g, b] = pnl > 0 ? GREEN : RED
  return { backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})` }
}
