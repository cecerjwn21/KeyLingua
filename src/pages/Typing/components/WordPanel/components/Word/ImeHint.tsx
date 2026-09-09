import type { ReactNode } from 'react'

type ImeHintProps = {
  label: string
  lines: string[]
  children: ReactNode
}

export default function ImeHint({ label, lines, children }: ImeHintProps) {
  return (
    <button
      type="button"
      aria-label={`${label} IME input hint`}
      className="group relative inline-flex items-baseline self-baseline border-0 bg-transparent p-0 font-inherit leading-[inherit] outline-none"
    >
      {children}
      <div
        role="tooltip"
        className="invisible absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-left font-sans text-sm leading-5 text-white opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100 dark:bg-gray-100 dark:text-gray-900"
      >
        {lines.map((line, index) => (
          <div key={`${line}-${index}`} className={index === 1 ? 'font-mono font-semibold' : ''}>
            {line}
          </div>
        ))}
      </div>
    </button>
  )
}
