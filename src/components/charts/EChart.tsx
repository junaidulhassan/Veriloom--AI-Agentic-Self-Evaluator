import { memo, useMemo } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import {
  BarChart,
  BoxplotChart,
  FunnelChart,
  GaugeChart,
  HeatmapChart,
  LineChart,
  PieChart,
  RadarChart,
  SankeyChart,
  TreemapChart,
} from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  RadarComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useThemeColors } from '@/hooks/useThemeColors'

echarts.use([
  BarChart,
  BoxplotChart,
  FunnelChart,
  GaugeChart,
  HeatmapChart,
  LineChart,
  PieChart,
  RadarChart,
  SankeyChart,
  TreemapChart,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
])

export type ThemedOption = (colors: ReturnType<typeof useThemeColors>) => EChartsOption

export const EChart = memo(function EChart({
  option,
  height = 280,
  ariaLabel,
  onClick,
}: {
  option: ThemedOption
  height?: number
  ariaLabel: string
  onClick?: (params: { name?: string; data?: unknown; dataIndex?: number }) => void
}) {
  const colors = useThemeColors()
  const reduced = useReducedMotion()
  const resolved = useMemo<EChartsOption>(() => {
    const base = option(colors)
    return {
      animation: !reduced,
      animationDuration: 1100,
      animationEasing: 'cubicOut',
      animationDurationUpdate: 600,
      color: colors.series,
      textStyle: { fontFamily: 'Manrope, sans-serif', color: colors['chart-axis'] },
      tooltip: {
        backgroundColor: colors['surface-strong'],
        borderColor: colors.line,
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: colors['chart-ink'], fontSize: 12, fontFamily: 'Manrope, sans-serif' },
        extraCssText:
          'border-radius:16px;backdrop-filter:blur(16px);box-shadow:0 12px 32px -12px rgba(28,28,31,.35);',
        ...(base.tooltip as object),
      },
      ...base,
    } as EChartsOption
  }, [option, colors, reduced])
  return (
    <div role="img" aria-label={ariaLabel}>
      <ReactEChartsCore
        echarts={echarts}
        option={resolved}
        notMerge
        lazyUpdate
        style={{ height, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        onEvents={onClick ? { click: onClick } : undefined}
      />
    </div>
  )
})

export default EChart
