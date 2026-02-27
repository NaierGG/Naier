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
}

export default function FriendItem({ friend, isSelected, onClick }: FriendItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-16 w-full border-l-2 px-3 transition-colors ${isSelected ? 'border-naier-blue bg-naier-blue/10' : 'border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
    >
      <div className="flex h-full items-center gap-3">
        <Avatar src={friend.picture} name={`${friend.nickname}|${friend.npub}`} size="md" />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium text-text-primary">{friend.nickname}</p>
          <p className="truncate text-sm text-text-secondary">{friend.lastMessage}</p>
        </div>
        <div className="flex h-full flex-col items-end justify-center gap-1">
          <span className="text-xs text-text-secondary">{friend.time}</span>
          <Badge count={friend.unread} />
        </div>
      </div>
    </button>
  )
}
