export const series = [
  'var(--series-1)',
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)',
  'var(--series-6)',
]

export const statusColors = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  error: 'var(--error)',
  info: 'var(--info)',
  neutral: 'var(--series-neutral)',
}

export const axisProps = {
  stroke: 'var(--chart-grid)',
  tick: { fill: 'var(--chart-axis)', fontSize: 11, fontFamily: 'Manrope' },
  tickLine: false,
  axisLine: false,
} as const

export const gridProps = {
  stroke: 'var(--chart-grid)',
  strokeDasharray: '3 4',
  vertical: false,
} as const

export const legendProps = {
  iconType: 'circle' as const,
  iconSize: 8,
  wrapperStyle: { fontSize: 12, color: 'var(--chart-axis)', paddingTop: 8 },
}

export const cursorStyle = { fill: 'rgb(28 28 31 / 0.05)' }
export const lineCursor = { stroke: 'var(--chart-axis)', strokeOpacity: 0.4, strokeDasharray: '4 4' }

export function seriesColor(index: number) {
  return series[index % series.length]
}
