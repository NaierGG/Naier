import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SimplePool } from 'nostr-tools'
import ChatPanel from './components/chat/ChatPanel'
import AddFriendModal from './components/friend/AddFriendModal'
import type { FriendListItem } from './components/friend/FriendItem'
import KeyImportModal from './components/key/KeyImportModal'
import KeyPanel from './components/key/KeyPanel'
import Sidebar from './components/layout/Sidebar'
import ProfilePanel from './components/profile/ProfilePanel'
import RelayPanel from './components/relay/RelayPanel'
import Toast from './components/ui/Toast'
import { STORAGE_KEYS } from './constants/relays'
import useChat from './hooks/useChat'
import useFriendPreviews from './hooks/useFriendPreviews'
import useFriends from './hooks/useFriends'
import useKeys from './hooks/useKeys'
import useProfile from './hooks/useProfile'
import useRelays from './hooks/useRelays'
import { storage } from './lib/storage'
import type { Friend } from './types'

type ToastState = {
  message: string
  type: 'success' | 'error' | 'info'
} | null

type ModalState = 'none' | 'key' | 'addFriend' | 'profile' | 'relay'

function parseLastRead(raw: string | null): Record<string, number> {
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return Object.entries(parsed).reduce<Record<string, number>>((acc, [pubkey, value]) => {
      if (typeof value === 'number') {
        acc[pubkey] = value
      }
      return acc
    }, {})
  } catch {
    return {}
  }
}

export default function App() {
  const [mobileView, setMobileView] = useState<'friends' | 'chat'>('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [modal, setModal] = useState<ModalState>('none')
  const [isKeyImportOpen, setKeyImportOpen] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type })
  }, [])

  const {
    keys,
    saveToStorage,
    isLoading: isKeyLoading,
    generateNewKeys,
    importFromNsec,
    toggleStorage,
    clearKeys,
  } = useKeys()

  const pool = useMemo(() => new SimplePool(), [])
  const { relays, statuses, addRelay, removeRelay, resetToDefault } = useRelays({ pool })
  const relaysRef = useRef(relays)

  useEffect(() => {
    relaysRef.current = relays
  }, [relays])

  const { myProfile, getProfile, updateMyProfile } = useProfile({ pool, relays, keys })
  const { friends, loadFriends, addFriend, removeFriend } = useFriends({
    pool,
    relays,
    keys,
    getProfile,
  })
  const { previews } = useFriendPreviews({ pool, relays, keys, friends })
  const {
    messages,
    isLoading: isChatLoading,
    isSubscribed,
    lastReceivedAt,
    error: chatError,
    sendMessage,
    subscribe,
    unsubscribe,
  } = useChat({
    pool,
    relays,
    keys,
    onError: (message) => showToast(message, 'error'),
  })

  useEffect(() => {
    if (!isKeyLoading && !keys && modal === 'none') {
      setModal('key')
    }
  }, [isKeyLoading, keys, modal])

  useEffect(() => {
    if (!keys) {
      return
    }

    void loadFriends()
  }, [keys, loadFriends])

  useEffect(() => {
    return () => {
      pool.close(relaysRef.current)
    }
  }, [pool])

  useEffect(() => {
    if (!friends.length) {
      setSelectedFriend(null)
      return
    }

    if (!selectedFriend || !friends.some((friend) => friend.pubkey === selectedFriend.pubkey)) {
      setSelectedFriend(friends[0])
    }
  }, [friends, selectedFriend])

  useEffect(() => {
    if (!selectedFriend) {
      unsubscribe()
      return
    }

    subscribe(selectedFriend.pubkey)
    return () => unsubscribe()
  }, [selectedFriend?.pubkey, subscribe, unsubscribe])

  const relayStatus = useMemo<'connected' | 'connecting' | 'disconnected'>(() => {
    if (statuses.some((status) => status.status === 'connected')) {
      return 'connected'
    }
    if (statuses.some((status) => status.status === 'connecting')) {
      return 'connecting'
    }
    return 'disconnected'
  }, [statuses])

  const myNpub = keys?.npub ?? (isKeyLoading ? 'Loading keys...' : 'No key generated')
  const inviteLink = keys?.npub ? `${window.location.origin}/add/${keys.npub}` : ''

  const friendItems = useMemo<FriendListItem[]>(
    () =>
      friends
        .map((friend) => {
          const preview = previews.get(friend.pubkey)
          const lastMsgAt = preview?.lastMessageAt

          const time = lastMsgAt
            ? new Date(lastMsgAt * 1000).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '--:--'

          return {
            id: friend.pubkey,
            nickname: friend.nickname,
            npub: friend.npub,
            picture: friend.picture,
            lastMessage: preview?.lastMessage || 'Start chatting',
            time,
            unread: preview?.unread ?? 0,
            relayStatus,
          }
        })
        .sort((a, b) => {
          const aTime = previews.get(a.id)?.lastMessageAt ?? 0
          const bTime = previews.get(b.id)?.lastMessageAt ?? 0
          return bTime - aTime
        }),
    [friends, previews, relayStatus],
  )

  const filteredFriends = useMemo(
    () =>
      friendItems.filter((friend) => {
        const keyword = searchQuery.toLowerCase()
        return (
          friend.nickname.toLowerCase().includes(keyword) || friend.npub.toLowerCase().includes(keyword)
        )
      }),
    [friendItems, searchQuery],
  )

  const selectedFriendItem = useMemo(
    () => friendItems.find((friend) => friend.id === selectedFriend?.pubkey) || null,
    [friendItems, selectedFriend?.pubkey],
  )

  const selectedFriendId = selectedFriend?.pubkey || null

  const handleSelectFriend = (friendPubkey: string) => {
    const now = Math.floor(Date.now() / 1000)
    const lastRead = parseLastRead(storage.get(STORAGE_KEYS.LAST_READ))
    if ((lastRead[friendPubkey] || 0) < now) {
      storage.set(
        STORAGE_KEYS.LAST_READ,
        JSON.stringify({
          ...lastRead,
          [friendPubkey]: now,
        }),
      )
    }

    const friend = friends.find((item) => item.pubkey === friendPubkey) || null
    setSelectedFriend(friend)
  }

  const handleRemoveFriend = useCallback(
    async (friendPubkey: string) => {
      try {
        await removeFriend(friendPubkey)

        if (selectedFriend?.pubkey === friendPubkey) {
          setSelectedFriend(null)
        }

        showToast('Friend removed', 'info')
      } catch {
        showToast('Failed to remove friend', 'error')
      }
    },
    [removeFriend, selectedFriend?.pubkey, showToast],
  )

  return (
    <div className="h-screen overflow-hidden bg-bg-primary text-text-primary">
      <div className="hidden h-full md:block">
        <aside className="fixed inset-y-0 left-0 w-72">
          <Sidebar
            friends={filteredFriends}
            selectedFriendId={selectedFriendId}
            searchQuery={searchQuery}
            myNpub={myNpub}
            onSearchQueryChange={setSearchQuery}
            onSelectFriend={handleSelectFriend}
            onRemoveFriend={handleRemoveFriend}
            onOpenAddFriend={() => setModal('addFriend')}
            onOpenRelays={() => setModal('relay')}
            onOpenSettings={() => setModal('profile')}
            onOpenKeyPanel={() => setModal('key')}
          />
        </aside>

        <main className="ml-72 h-full">
          <ChatPanel
            friend={selectedFriendItem}
            messages={messages}
            isLoading={isChatLoading}
            isSubscribed={isSubscribed}
            lastReceivedAt={lastReceivedAt}
            error={chatError}
            relayStatus={selectedFriend ? relayStatus : 'disconnected'}
            onSendMessage={sendMessage}
          />
        </main>
      </div>

      <div className="h-full md:hidden">
        {mobileView === 'friends' ? (
          <Sidebar
            friends={filteredFriends}
            selectedFriendId={selectedFriendId}
            searchQuery={searchQuery}
            myNpub={myNpub}
            isMobile
            onSearchQueryChange={setSearchQuery}
            onSelectFriend={(friendPubkey) => {
              handleSelectFriend(friendPubkey)
              setMobileView('chat')
            }}
            onRemoveFriend={handleRemoveFriend}
            onOpenAddFriend={() => setModal('addFriend')}
            onOpenRelays={() => setModal('relay')}
            onOpenSettings={() => setModal('profile')}
            onOpenKeyPanel={() => setModal('key')}
          />
        ) : (
          <ChatPanel
            friend={selectedFriendItem}
            messages={messages}
            isLoading={isChatLoading}
            isSubscribed={isSubscribed}
            lastReceivedAt={lastReceivedAt}
            error={chatError}
            relayStatus={selectedFriend ? relayStatus : 'disconnected'}
            showBackButton
            onBack={() => setMobileView('friends')}
            onSendMessage={sendMessage}
          />
        )}
      </div>

      <AddFriendModal
        isOpen={modal === 'addFriend'}
        onClose={() => setModal('none')}
        myNpub={keys?.npub || ''}
        inviteLink={inviteLink}
        hasKeys={Boolean(keys)}
        addFriend={addFriend}
        onToast={showToast}
      />

      <RelayPanel
        isOpen={modal === 'relay'}
        onClose={() => setModal('none')}
        statuses={statuses}
        addRelay={addRelay}
        removeRelay={removeRelay}
        resetToDefault={resetToDefault}
        onToast={showToast}
      />

      <KeyPanel
        isOpen={modal === 'key'}
        onClose={() => setModal('none')}
        keys={keys}
        saveToStorage={saveToStorage}
        isLoading={isKeyLoading}
        onGenerateNewKeys={generateNewKeys}
        onImportFromNsec={importFromNsec}
        onToggleStorage={toggleStorage}
        onClearKeys={() => {
          clearKeys()
          showToast('Key cleared', 'info')
        }}
        onOpenImportModal={() => setKeyImportOpen(true)}
        onToast={showToast}
      />

      <KeyImportModal
        isOpen={isKeyImportOpen}
        onClose={() => setKeyImportOpen(false)}
        onImportFromNsec={importFromNsec}
        onToast={showToast}
      />

      <ProfilePanel
        isOpen={modal === 'profile'}
        onClose={() => setModal('none')}
        hasKeys={Boolean(keys)}
        myProfile={myProfile}
        updateMyProfile={updateMyProfile}
        onToast={showToast}
      />

      {toast ? (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      ) : null}
    </div>
  )
}
