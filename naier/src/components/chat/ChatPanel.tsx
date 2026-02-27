import type { Message } from '@/types'
import type { FriendListItem } from '../friend/FriendItem'
import ChatHeader, { type RelayConnectionStatus } from './ChatHeader'
import MessageInput from './MessageInput'
import MessageList from './MessageList'

interface ChatPanelProps {
  friend: FriendListItem | null
  messages: Message[]
  isLoading: boolean
  isSubscribed: boolean
  lastReceivedAt: number | null
  error: string | null
  relayStatus: RelayConnectionStatus
  showBackButton?: boolean
  onBack?: () => void
  onSendMessage?: (value: string) => Promise<void>
}

export default function ChatPanel({
  friend,
  messages,
  isLoading,
  isSubscribed,
  lastReceivedAt,
  error,
  relayStatus,
  showBackButton = false,
  onBack,
  onSendMessage,
}: ChatPanelProps) {
  if (!friend) {
    return (
      <section className="flex h-full items-center justify-center bg-bg-primary p-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-10 w-10 fill-text-secondary" aria-hidden="true">
            <path d="M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9.41L6 19.41A1 1 0 0 1 4.29 18.7V16.8A3 3 0 0 1 2 14V5a1 1 0 1 1 2 0v9a1 1 0 0 0 1 1h.29A1 1 0 0 1 6 16v.29L8.59 14.7a1 1 0 0 1 .7-.29H17a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v4a1 1 0 1 1-2 0V5Z" />
          </svg>
          <p className="text-lg font-semibold text-text-primary">Select a friend to start chatting</p>
        </div>
      </section>
    )
  }

  const lastReceived = lastReceivedAt
    ? new Date(lastReceivedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '--:--'

  return (
    <section className="flex h-full flex-col bg-bg-primary">
      <ChatHeader
        friend={friend}
        relayStatus={relayStatus}
        isSubscribed={isSubscribed}
        lastReceived={lastReceived}
        showBackButton={showBackButton}
        onBack={onBack}
      />

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <MessageList messages={messages} isLoading={isLoading} />
      <MessageInput onSend={onSendMessage} disabled={!isSubscribed} />
    </section>
  )
}
