import { PieChart, Pie, Cell } from 'recharts'

interface DonutRingProps {
  value: number | null
  size?: number
  thickness?: number
  label?: string
}

export function DonutRing({ value, size = 96, thickness = 10, label }: DonutRingProps) {
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value))
  const data = [
    { name: 'win', v: pct },
    { name: 'rest', v: 100 - pct },
  ]

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          dataKey="v"
          cx="50%"
          cy="50%"
          innerRadius={size / 2 - thickness}
          outerRadius={size / 2}
          startAngle={90}
          endAngle={-270}
          stroke="none"
          isAnimationActive={false}
        >
          <Cell fill="var(--accent-green)" />
          <Cell fill="var(--surface-raised)" />
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono tabular-nums text-lg font-medium text-text-primary">
          {value === null ? '—' : `${pct.toFixed(0)}%`}
        </span>
        {label && <span className="text-[11px] text-text-muted">{label}</span>}
      </div>
    </div>
  )
}
