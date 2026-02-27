import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}

const toneMap: Record<ToastProps['type'], string> = {
  success: 'border-green-200 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/60 dark:text-green-300',
  error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/60 dark:text-red-300',
  info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onClose()
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-5 right-5 z-[60] max-w-xs">
      <div
        className={`toast-slide-in flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${toneMap[type]}`}
        role="status"
      >
        <p className="flex-1">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-0.5 transition-colors hover:bg-black/10"
          aria-label="Close notification"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.12L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
