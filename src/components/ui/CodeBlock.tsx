import { memo, useState } from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx'
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql'
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java'
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go'
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust'
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c'
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp'
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown'
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { cn, copyText } from '@/lib/utils'

const languages = {
  python,
  javascript,
  typescript,
  tsx,
  jsx,
  json,
  bash,
  sql,
  yaml,
  css,
  java,
  go,
  rust,
  c,
  cpp,
  markdown,
}
Object.entries(languages).forEach(([name, grammar]) => SyntaxHighlighter.registerLanguage(name, grammar))

const aliases: Record<string, string> = {
  py: 'python',
  js: 'javascript',
  ts: 'typescript',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  md: 'markdown',
  'c++': 'cpp',
}

const theme = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: 'transparent',
    margin: 0,
    padding: 0,
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
    fontFamily: 'var(--font-mono)',
    fontSize: '12.5px',
  },
}

export function CopyButton({
  text,
  label = 'Copy',
  className,
}: {
  text: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      aria-label={copied ? 'Copied' : label}
      onClick={async () => {
        try {
          await copyText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1400)
        } catch {
          toast.error('Copy failed')
        }
      }}
      className={cn(
        'text-terminal-ink/80 hover:text-terminal-ink inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition-colors hover:bg-white/10',
        className,
      )}
    >
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? 'Copied' : label}
    </button>
  )
}

export const CodeBlock = memo(function CodeBlock({
  code,
  language,
  title,
  maxHeight = 420,
  className,
  showCopy = true,
}: {
  code: string
  language?: string
  title?: string
  maxHeight?: number
  className?: string
  showCopy?: boolean
}) {
  const lang = aliases[language ?? ''] ?? language ?? 'text'
  const known = lang in languages
  return (
    <div
      className={cn(
        'bg-terminal text-terminal-ink overflow-hidden rounded-2xl shadow-inner ring-1 ring-black/20',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="text-terminal-ink/60 font-mono text-[11px] tracking-wider uppercase">
          {title ?? lang}
        </span>
        {showCopy ? <CopyButton text={code} label="Copy code" /> : null}
      </div>
      <div className="overflow-auto px-4 py-3" style={{ maxHeight }}>
        {known ? (
          <SyntaxHighlighter language={lang} style={theme} PreTag="div" wrapLongLines={false}>
            {code.replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <pre className="font-mono text-[12.5px] leading-relaxed whitespace-pre">{code}</pre>
        )}
      </div>
    </div>
  )
})
