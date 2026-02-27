import Avatar from '../profile/Avatar'
import Badge from '../ui/Badge'

export interface FriendListItem {
  id: string
  nickname: string
  npub: string
  picture?: string
  lastMessage: string
  time: string
  unread: number
  relayStatus: 'connected' | 'connecting' | 'disconnected'
}

interface FriendItemProps {
  friend: FriendListItem
  isSelected: boolean
  onClick: () => void
  onRemove?: (pubkey: string) => void
}

export default function FriendItem({ friend, isSelected, onClick, onRemove }: FriendItemProps) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        className={`h-16 w-full border-l-2 px-3 pr-10 text-left transition-colors ${isSelected ? 'border-naier-blue bg-naier-blue/10' : 'border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
      >
        <div className="flex h-full items-center gap-3">
          <Avatar src={friend.picture} name={`${friend.nickname}|${friend.npub}`} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">{friend.nickname}</p>
            <p className="truncate text-sm text-text-secondary">{friend.lastMessage}</p>
          </div>
          <div className="flex h-full flex-col items-end justify-center gap-1">
            <span className="text-xs text-text-secondary">{friend.time}</span>
            <Badge count={friend.unread} />
          </div>
        </div>
      </button>

      {onRemove ? (
        <button
          type="button"
          className="absolute right-2 top-2 z-10 flex rounded-full p-1 text-text-secondary transition-colors hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto"
          onClick={(event) => {
            event.stopPropagation()
            if (window.confirm(`Remove ${friend.nickname} from your contacts?`)) {
              onRemove(friend.id)
            }
          }}
          aria-label={`Remove ${friend.nickname}`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              d="M18 6 6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>
      ) : null}
    </div>
  )
}
