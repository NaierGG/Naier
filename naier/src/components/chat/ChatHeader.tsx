import type { FriendListItem } from '../friend/FriendItem'
import Avatar from '../profile/Avatar'

export type RelayConnectionStatus = 'connected' | 'connecting' | 'disconnected'

interface ChatHeaderProps {
  friend: FriendListItem
  relayStatus: RelayConnectionStatus
  isSubscribed: boolean
  lastReceived: string
  showBackButton?: boolean
  onBack?: () => void
}

const statusDotClassMap: Record<RelayConnectionStatus, string> = {
  connected: 'bg-emerald-500',
  connecting: 'bg-yellow-500',
  disconnected: 'bg-red-500',
}

export default function ChatHeader({
  friend,
  relayStatus,
  isSubscribed,
  lastReceived,
  showBackButton = false,
  onBack,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-bg-primary px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        {showBackButton ? (
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-1 text-text-secondary hover:bg-gray-100 hover:text-text-primary dark:hover:bg-zinc-700"
            aria-label="Back to friend list"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M14.7 5.3a1 1 0 0 1 0 1.4L10.41 11H20a1 1 0 1 1 0 2h-9.59l4.3 4.3a1 1 0 0 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.41 0Z" />
            </svg>
          </button>
        ) : null}
        <Avatar src={friend.picture} name={`${friend.nickname}|${friend.npub}`} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{friend.nickname}</p>
          <p className="truncate text-xs text-text-secondary">{friend.npub.slice(0, 8)}</p>
        </div>
      </div>

      <div className="text-right">
        <div className="mb-1 inline-flex items-center gap-1 text-xs text-text-secondary">
          <span className={`h-2 w-2 rounded-full ${statusDotClassMap[relayStatus]}`} />
          <span className="capitalize">{relayStatus}</span>
        </div>
        <p className="text-xs text-text-secondary">
          {isSubscribed ? 'Subscribed' : 'Not subscribed'} | Last received: {lastReceived}
        </p>
      </div>
    </header>
  )
}
