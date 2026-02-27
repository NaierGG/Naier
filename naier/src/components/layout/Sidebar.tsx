import FriendList from '../friend/FriendList'
import type { FriendListItem } from '../friend/FriendItem'
import Avatar from '../profile/Avatar'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface SidebarProps {
  friends: FriendListItem[]
  selectedFriendId: string | null
  searchQuery: string
  myNpub: string
  isMobile?: boolean
  onSearchQueryChange: (value: string) => void
  onSelectFriend: (friendId: string) => void
  onRemoveFriend: (friendId: string) => void
  onOpenAddFriend: () => void
  onOpenRelays: () => void
  onOpenSettings: () => void
  onOpenKeyPanel: () => void
}

function shortenNpub(npub: string) {
  if (npub.length <= 12) {
    return npub
  }

  return `${npub.slice(0, 8)}...${npub.slice(-4)}`
}

export default function Sidebar({
  friends,
  selectedFriendId,
  searchQuery,
  myNpub,
  isMobile = false,
  onSearchQueryChange,
  onSelectFriend,
  onRemoveFriend,
  onOpenAddFriend,
  onOpenRelays,
  onOpenSettings,
  onOpenKeyPanel,
}: SidebarProps) {
  return (
    <aside className={`flex h-full flex-col bg-bg-sidebar ${isMobile ? '' : 'border-r border-border'}`}>
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-xl font-bold text-text-primary">Naier</h1>
        <Button variant="ghost" size="sm" onClick={onOpenSettings} className="!px-2.5">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M10.58 3.34a1.5 1.5 0 0 1 2.84 0l.42 1.1a1.5 1.5 0 0 0 1.63.94l1.17-.17a1.5 1.5 0 0 1 1.42 2.46l-.76.9a1.5 1.5 0 0 0 0 1.88l.76.9a1.5 1.5 0 0 1-1.42 2.46l-1.17-.17a1.5 1.5 0 0 0-1.63.94l-.42 1.1a1.5 1.5 0 0 1-2.84 0l-.42-1.1a1.5 1.5 0 0 0-1.63-.94l-1.17.17a1.5 1.5 0 0 1-1.42-2.46l.76-.9a1.5 1.5 0 0 0 0-1.88l-.76-.9a1.5 1.5 0 0 1 1.42-2.46l1.17.17a1.5 1.5 0 0 0 1.63-.94l.42-1.1ZM12 9.25a2.75 2.75 0 1 0 0 5.5 2.75 2.75 0 0 0 0-5.5Z" />
          </svg>
        </Button>
      </div>

      <button
        type="button"
        onClick={onOpenKeyPanel}
        className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-border bg-bg-primary px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800"
      >
        <Avatar size="sm" name={myNpub} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">My Profile</p>
          <p className="truncate text-xs text-text-secondary">{shortenNpub(myNpub)}</p>
        </div>
      </button>

      <div className="px-4 pt-3">
        <Input
          value={searchQuery}
          onChange={onSearchQueryChange}
          placeholder="Search friends"
          rightElement={
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M10.5 3a7.5 7.5 0 1 1-4.74 13.31l-2.53 2.53a1 1 0 0 1-1.41-1.41l2.53-2.53A7.5 7.5 0 0 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" />
            </svg>
          }
        />
      </div>

      <div className="min-h-0 flex-1 px-2 pt-2">
        <FriendList
          friends={friends}
          selectedFriendId={selectedFriendId}
          onSelectFriend={onSelectFriend}
          onRemoveFriend={onRemoveFriend}
        />
      </div>

      <div className="border-t border-border p-4">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="primary" size="md" onClick={onOpenAddFriend}>
            + Add Friend
          </Button>
          <Button variant="secondary" size="md" onClick={onOpenRelays}>
            Relays
          </Button>
        </div>
      </div>
    </aside>
  )
}

