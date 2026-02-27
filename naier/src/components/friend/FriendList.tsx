import FriendItem, { type FriendListItem } from './FriendItem'

interface FriendListProps {
  friends: FriendListItem[]
  selectedFriendId: string | null
  onSelectFriend: (id: string) => void
  onRemoveFriend?: (id: string) => void
}

export default function FriendList({
  friends,
  selectedFriendId,
  onSelectFriend,
  onRemoveFriend,
}: FriendListProps) {
  if (friends.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-text-secondary">
        <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden="true">
          <path d="M15 12a4 4 0 1 0-3-6.7A4 4 0 1 0 9 12a5 5 0 0 0-5 5v1a1 1 0 1 0 2 0v-1a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v1a1 1 0 1 0 2 0v-1a5 5 0 0 0-5-5ZM8 8a2 2 0 1 1 2 2 2 2 0 0 1-2-2Zm8 0a2 2 0 1 1-2-2 2 2 0 0 1 2 2Z" />
        </svg>
        <p className="text-sm">You have no contacts yet</p>
        <p className="text-xs">Press + to add a friend</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {friends.map((friend) => (
        <FriendItem
          key={friend.id}
          friend={friend}
          isSelected={selectedFriendId === friend.id}
          onClick={() => onSelectFriend(friend.id)}
          onRemove={onRemoveFriend}
        />
      ))}
    </div>
  )
}
