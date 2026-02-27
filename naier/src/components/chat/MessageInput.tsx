import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import Button from '../ui/Button'

interface MessageInputProps {
  disabled?: boolean
  onSend?: (value: string) => Promise<void>
}

function isImageUrl(text: string): boolean {
  const trimmed = text.trim()
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(trimmed)
}

export default function MessageInput({ disabled = false, onSend }: MessageInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function adjustHeight() {
    const element = textareaRef.current
    if (!element) {
      return
    }

    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 120)}px`
  }

  useEffect(() => {
    adjustHeight()
  }, [inputValue])

  async function handleSend() {
    const trimmed = inputValue.trim()
    if (!trimmed || disabled || isSending) {
      return
    }

    setIsSending(true)
    try {
      await onSend?.(trimmed)
      setInputValue('')
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="sticky bottom-0 border-t border-border bg-white/95 p-3 backdrop-blur dark:bg-zinc-900/95">
      {isImageUrl(inputValue) ? (
        <div className="px-3 pb-2">
          <img src={inputValue} className="h-16 rounded-lg" alt="preview" />
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={inputValue}
          disabled={disabled || isSending}
          rows={1}
          placeholder="Type a message..."
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-xl border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-naier-blue/40 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <Button
          variant="primary"
          size="md"
          onClick={() => void handleSend()}
          disabled={!inputValue.trim() || disabled || isSending}
          isLoading={isSending}
        >
          Send
        </Button>
      </div>
    </div>
  )
}
