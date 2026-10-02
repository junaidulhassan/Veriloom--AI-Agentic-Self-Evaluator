import { useMemo } from 'react'
import { useSettingsStore } from '@/store/settings'

const tokens = [
  'chart-surface',
  'chart-grid',
  'chart-axis',
  'chart-ink',
  'series-1',
  'series-2',
  'series-3',
  'series-4',
  'series-5',
  'series-6',
  'series-neutral',
  'seq-0',
  'seq-1',
  'seq-2',
  'seq-3',
  'seq-4',
  'seq-5',
  'success',
  'warning',
  'error',
  'info',
  'ink',
  'ink-muted',
  'surface-strong',
  'line',
] as const

export type ThemeColors = Record<(typeof tokens)[number], string> & { series: string[]; sequential: string[] }

export function readThemeColors(): ThemeColors {
  const style = getComputedStyle(document.documentElement)
  const values = Object.fromEntries(
    tokens.map((token) => [token, style.getPropertyValue(`--${token}`).trim()]),
  ) as Record<(typeof tokens)[number], string>
  return {
    ...values,
    series: [
      values['series-1'],
      values['series-2'],
      values['series-3'],
      values['series-4'],
      values['series-5'],
      values['series-6'],
    ],
    sequential: [
      values['seq-0'],
      values['seq-1'],
      values['seq-2'],
      values['seq-3'],
      values['seq-4'],
      values['seq-5'],
    ],
  }
}

export function useThemeColors() {
  const theme = useSettingsStore((s) => s.theme)
  return useMemo(() => {
    void theme
    return readThemeColors()
  }, [theme])
}
