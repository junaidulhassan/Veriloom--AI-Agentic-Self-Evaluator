import { memo } from 'react'
import { motion } from 'framer-motion'
import { Calculator, DatabaseSearch, FileQuestion, Globe, ShieldCheck, SquareTerminal } from 'lucide-react'
import { LogoMark, Wordmark } from '@/components/ui/Logo'
import { fadeUp, stagger } from '@/lib/motion'

const suggestions = [
  {
    icon: Globe,
    title: 'Search the web',
    prompt: 'What are the most important AI research announcements from this week? Cite your sources.',
    tag: 'Web Search',
  },
  {
    icon: DatabaseSearch,
    title: 'Ask your documents',
    prompt: 'Summarize the key findings in my uploaded documents and cite the pages you used.',
    tag: 'Vector Database',
  },
  {
    icon: Calculator,
    title: 'Exact calculation',
    prompt: 'If I invest 12,500 at 6.8% compounded monthly, what is the balance after 7 years?',
    tag: 'Calculator',
  },
  {
    icon: SquareTerminal,
    title: 'Run Python code',
    prompt: 'Write and run Python that finds the first 15 prime numbers whose digits sum to a prime.',
    tag: 'Sandbox',
  },
  {
    icon: FileQuestion,
    title: 'Compare sources',
    prompt: 'Compare what my documents say about the main topic with the latest information online.',
    tag: 'Multi-tool',
  },
  {
    icon: ShieldCheck,
    title: 'Fact-check a claim',
    prompt:
      'Fact-check this claim and explain your confidence: The Great Wall of China is visible from space.',
    tag: 'Self-eval',
  },
]

export const ChatWelcome = memo(function ChatWelcome({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-8">
      <motion.div
        variants={stagger(0.06)}
        initial="hidden"
        animate="show"
        className="m-auto w-full max-w-3xl text-center"
      >
        <motion.div variants={fadeUp} className="mx-auto mb-5 w-fit">
          <LogoMark size={64} />
        </motion.div>
        <h1 className="font-display text-on-page text-[clamp(44px,8vw,84px)] leading-[1.15] font-bold">
          <Wordmark />
        </h1>
        <motion.p
          variants={fadeUp}
          className="text-on-page/80 mx-auto mt-4 max-w-lg text-[15px] font-medium text-balance"
        >
          An agent that weaves web search, your documents, exact math and live Python into answers it verifies
          before you read them.
        </motion.p>
        <motion.ul
          variants={stagger(0.07, 0.35)}
          initial="hidden"
          animate="show"
          className="mt-9 grid grid-cols-1 gap-3 text-left sm:grid-cols-2 lg:grid-cols-3"
        >
          {suggestions.map((item) => {
            const Icon = item.icon
            return (
              <motion.li key={item.title} variants={fadeUp}>
                <button
                  type="button"
                  onClick={() => onPick(item.prompt)}
                  className="glass group flex h-full w-full flex-col gap-2 rounded-[var(--radius-card)] p-4 text-left transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]"
                >
                  <span className="flex items-center justify-between">
                    <span className="bg-charcoal-900 text-cream dark:bg-coral-500 dark:text-charcoal-900 grid size-9 place-items-center rounded-xl transition-transform group-hover:scale-105">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="bg-charcoal-900/[0.07] text-ink-soft dark:bg-cream/10 rounded-full px-2 py-0.5 text-[10.5px] font-bold">
                      {item.tag}
                    </span>
                  </span>
                  <span className="font-display text-ink text-[15px] font-bold">{item.title}</span>
                  <span className="text-ink-muted line-clamp-2 text-xs leading-relaxed">{item.prompt}</span>
                </button>
              </motion.li>
            )
          })}
        </motion.ul>
      </motion.div>
    </div>
  )
})
