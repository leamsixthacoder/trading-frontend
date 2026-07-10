import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  AreaSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts'
import { ChartSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { formatMoney } from '../../lib/format'

export interface ChartPoint {
  time: string
  value: number
}

interface LineAreaChartProps {
  title: string
  data: ChartPoint[]
  loading?: boolean
  emptyMessage: string
  variant?: 'area' | 'line'
  height?: number
  color?: string
}

export function LineAreaChart({
  title,
  data,
  loading,
  emptyMessage,
  variant = 'area',
  height = 260,
  color = '#3ECF8E',
}: LineAreaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | ISeriesApi<'Line'> | null>(null)
  const [tooltip, setTooltip] = useState<{ time: string; value: number; x: number; y: number } | null>(
    null,
  )

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: '#7E8F87',
        fontFamily: 'IBM Plex Mono, monospace',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: '#212B26' },
      },
      rightPriceScale: { borderColor: '#212B26' },
      timeScale: { borderColor: '#212B26' },
      crosshair: { vertLine: { color: '#8B7CF6', width: 1 }, horzLine: { color: '#8B7CF6', width: 1 } },
    })
    chartRef.current = chart

    const series =
      variant === 'area'
        ? chart.addSeries(AreaSeries, {
            lineColor: color,
            topColor: `${color}33`,
            bottomColor: `${color}00`,
            lineWidth: 2,
          })
        : chart.addSeries(LineSeries, { color, lineWidth: 2 })
    seriesRef.current = series

    chart.subscribeCrosshairMove((param) => {
      if (!param.point || !param.time || param.point.x < 0) {
        setTooltip(null)
        return
      }
      const point = param.seriesData.get(series)
      if (!point || !('value' in point)) {
        setTooltip(null)
        return
      }
      setTooltip({
        time: String(param.time),
        value: point.value,
        x: param.point.x,
        y: param.point.y,
      })
    })

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) chart.applyOptions({ width: entry.contentRect.width })
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, color, height])

  useEffect(() => {
    if (!seriesRef.current) return
    seriesRef.current.setData(data.map((d) => ({ time: d.time as Time, value: d.value })))
    chartRef.current?.timeScale().fitContent()
  }, [data])

  const showEmpty = !loading && data.length === 0

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="text-sm text-text-muted mb-3">{title}</div>
      {loading && <ChartSkeleton height={height} />}
      {showEmpty && <EmptyState title="Not enough history yet" description={emptyMessage} />}
      <div className="relative" style={{ display: loading || showEmpty ? 'none' : 'block' }}>
        <div ref={containerRef} />
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-xs shadow-lg"
            style={{
              left: Math.min(Math.max(tooltip.x, 60), (containerRef.current?.clientWidth ?? 300) - 60),
              top: Math.max(tooltip.y - 50, 0),
            }}
          >
            <div className="text-text-muted">{tooltip.time}</div>
            <div className="font-mono tabular-nums text-text-primary">{formatMoney(tooltip.value)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
