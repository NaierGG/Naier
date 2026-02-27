import { Fragment, useEffect, useRef } from 'react'
import type { Message } from '@/types'
import Spinner from '../ui/Spinner'
import MessageBubble from './MessageBubble'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
}

function getDateLabel(createdAt: number): string {
  return new Date(createdAt * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getDateKey(createdAt: number): string {
  const date = new Date(createdAt * 1000)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export default function MessageList({ messages, isLoading = false }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-text-secondary">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden="true">
            <path d="M7 4a3 3 0 0 0-3 3v12a1 1 0 0 0 1.7.7L9.41 16H17a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm0 2h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H9a1 1 0 0 0-.7.29L6 16.59V7a1 1 0 0 1 1-1Z" />
          </svg>
          <p className="text-sm">Send the first message</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((message, index) => {
            const prev = messages[index - 1]
            const showDate = !prev || getDateKey(prev.created_at) !== getDateKey(message.created_at)

            return (
              <Fragment key={message.id}>
                {showDate ? (
                  <div className="my-2 flex items-center justify-center">
                    <span className="rounded-full border border-border bg-bg-sidebar px-3 py-1 text-xs text-text-secondary">
                      {getDateLabel(message.created_at)}
                    </span>
                  </div>
                ) : null}
                <MessageBubble message={message} />
              </Fragment>
            )
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}
