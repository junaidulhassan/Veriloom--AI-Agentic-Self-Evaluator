import { Fragment, memo } from 'react'
import { escapeRegExp } from '@/lib/utils'

export const Highlight = memo(function Highlight({ text, term }: { text: string; term?: string }) {
  const needle = term?.trim()
  if (!needle) return <>{text}</>
  const words = needle
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map(escapeRegExp)
  if (!words.length) return <>{text}</>
  const parts = text.split(new RegExp(`(${words.join('|')})`, 'gi'))
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="mark-hit">
            {part}
          </mark>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  )
})
