import { memo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'
import { CodeBlock } from './CodeBlock'

const components: Components = {
  code({ className, children, ...props }) {
    const match = /language-([\w+-]+)/.exec(className ?? '')
    const text = String(children ?? '')
    if (match || text.includes('\n')) {
      return <CodeBlock code={text} language={match?.[1]} className="my-3" />
    }
    return (
      <code
        className="bg-charcoal-900/[0.08] dark:bg-cream/10 rounded-md px-1.5 py-0.5 font-mono text-[0.86em]"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre({ children }) {
    return <>{children}</>
  },
  a({ children, href, ...props }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="text-coral-700 decoration-coral-300 hover:decoration-coral-700 dark:text-coral-300 font-semibold underline underline-offset-2"
        {...props}
      >
        {children}
      </a>
    )
  },
  table({ children }) {
    return (
      <div className="border-line my-3 overflow-x-auto rounded-xl border">
        <table className="w-full border-collapse text-[13px]">{children}</table>
      </div>
    )
  },
  th({ children }) {
    return (
      <th className="border-line bg-charcoal-900/[0.05] dark:bg-cream/5 border-b px-3 py-2 text-left font-bold">
        {children}
      </th>
    )
  },
  td({ children }) {
    return <td className="border-line border-b px-3 py-2 align-top">{children}</td>
  },
  blockquote({ children }) {
    return <blockquote className="border-coral-400 text-ink-soft my-3 border-l-4 pl-3">{children}</blockquote>
  },
}

const escapePercent = (value: string) => value.replace(/(^|[^\\])%/g, '$1\\%')

function normalizeMath(content: string) {
  return content
    .split(/(```[\s\S]*?(?:```|$)|`[^`\n]*`)/g)
    .map((part, index) => {
      if (index % 2 === 1) return part
      return part
        .replace(/\$\$([\s\S]+?)\$\$/g, (_m, inner: string) => `$$${escapePercent(inner)}$$`)
        .replace(/(^|[^\\$])\$(?!\$)([^$\n]+?)\$(?!\$)/g, (_match, lead: string, inner: string) => {
          const prose = /[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(inner) && !/\\[A-Za-z]/.test(inner)
          if (prose || /^\s|\s$/.test(inner)) return `${lead}\\$${inner}\\$`
          return `${lead}$${escapePercent(inner)}$`
        })
    })
    .join('')
}

export const Markdown = memo(function Markdown({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'text-ink max-w-none text-[14.5px] leading-[1.7] break-words',
        '[&_h1]:font-display [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold',
        '[&_h2]:font-display [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold',
        '[&_h3]:font-display [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-bold',
        '[&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5',
        '[&_hr]:border-line [&_hr]:my-4 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={components}
      >
        {normalizeMath(content)}
      </ReactMarkdown>
    </div>
  )
})
