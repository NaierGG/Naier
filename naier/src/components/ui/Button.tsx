import type { ReactNode } from 'react'
import Spinner from './Spinner'

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger'
  size: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  disabled?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
}

const variantClasses: Record<ButtonProps['variant'], string> = {
  primary: 'bg-naier-blue text-white hover:bg-naier-blue-dark',
  secondary: 'bg-gray-100 text-text-primary hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600',
  ghost: 'bg-transparent text-text-primary hover:bg-gray-100 dark:hover:bg-zinc-700',
  danger: 'bg-red-500 text-white hover:bg-red-600',
}

const sizeClasses: Record<ButtonProps['size'], string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export default function Button({
  variant,
  size,
  isLoading = false,
  disabled = false,
  onClick,
  children,
  className = '',
}: ButtonProps) {
  const isDisabled = disabled || isLoading
  const spinnerClass =
    variant === 'primary' || variant === 'danger' ? '!border-white !border-r-white/40' : ''

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-naier-blue/40 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {isLoading ? <Spinner size="sm" className={spinnerClass} /> : null}
      <span>{children}</span>
    </button>
  )
}
