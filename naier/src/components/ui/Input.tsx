import type { ReactNode } from 'react'

interface InputProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  type?: 'text' | 'password' | 'url'
  error?: string
  rightElement?: ReactNode
}

export default function Input({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  rightElement,
}: InputProps) {
  const hasError = Boolean(error)

  return (
    <div className="w-full">
      {label ? <label className="mb-1.5 block text-sm font-medium text-text-primary">{label}</label> : null}
      <div className="relative">
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-xl border bg-white/90 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/80 focus:outline-none focus:ring-2 dark:bg-zinc-800 ${rightElement ? 'pr-10' : ''} ${hasError ? 'border-red-500 focus:ring-red-400/30' : 'border-border focus:ring-naier-blue/40'}`}
        />
        {rightElement ? (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-secondary">
            {rightElement}
          </div>
        ) : null}
      </div>
      {hasError ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  )
}
