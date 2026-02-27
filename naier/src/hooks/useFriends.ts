import { useCallback, useState } from 'react'
import { finalizeEvent, nip04, nip19, type SimplePool } from 'nostr-tools'
import { STORAGE_KEYS } from '@/constants/relays'
import { storage } from '@/lib/storage'
import type { Friend, NostrKeys, Profile } from '@/types'

interface UseFriendsParams {
  pool: SimplePool
  relays: string[]
  keys: NostrKeys | null
  getProfile: (pubkey: string) => Promise<Profile | null>
}

export interface UseFriendsReturn {
  friends: Friend[]
  isLoading: boolean
  addFriend: (input: string) => Promise<{ success: boolean; error?: string }>
  removeFriend: (pubkey: string) => Promise<void>
  loadFriends: () => Promise<void>
  saveFriends: (friends: Friend[]) => Promise<void>
}

function isFriend(value: unknown): value is Friend {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.pubkey === 'string' &&
    typeof candidate.npub === 'string' &&
    typeof candidate.nickname === 'string' &&
    typeof candidate.addedAt === 'number'
  )
}

function parseFriends(raw: string | null): Friend[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isFriend).map((friend) => ({
      ...friend,
      pubkey: friend.pubkey.toLowerCase(),
    }))
  } catch {
    return []
  }
}

function resolvePubkey(input: string): string | null {
  const normalized = input.trim()

  if (normalized.startsWith('npub1')) {
    try {
      const decoded = nip19.decode(normalized)
      if (decoded.type !== 'npub' || typeof decoded.data !== 'string') {
        return null
      }
      return decoded.data.toLowerCase()
    } catch {
      return null
    }
  }

  if (/^[0-9a-fA-F]{64}$/.test(normalized)) {
    return normalized.toLowerCase()
  }

  return null
}

export default function useFriends({ pool, relays, keys, getProfile }: UseFriendsParams): UseFriendsReturn {
  const [friends, setFriends] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const saveFriends = useCallback(
    async (nextFriends: Friend[]): Promise<void> => {
      if (!keys) {
        return
      }

      const json = JSON.stringify(nextFriends)
      const encrypted = await nip04.encrypt(keys.privateKeyHex, keys.publicKey, json)

      const event = finalizeEvent(
        {
          kind: 10004,
          content: encrypted,
          tags: [],
          created_at: Math.floor(Date.now() / 1000),
        },
        keys.privateKey,
      )

      await Promise.any(pool.publish(relays, event))
      setFriends(nextFriends)
      storage.set(STORAGE_KEYS.FRIENDS, JSON.stringify(nextFriends))
    },
    [keys, pool, relays],
  )

  const loadFriends = useCallback(async (): Promise<void> => {
    setIsLoading(true)

    try {
      const cachedRaw = storage.get(STORAGE_KEYS.FRIENDS)
      if (cachedRaw) {
        const cachedFriends = parseFriends(cachedRaw)
        setFriends(cachedFriends)
      }

      if (!keys) {
        return
      }

      const events = await pool.querySync(relays, {
        authors: [keys.publicKey],
        kinds: [10004],
        limit: 1,
      })

      if (!events.length) {
        return
      }

      const latest = events.reduce((prev, next) =>
        next.created_at > prev.created_at ? next : prev,
      )
      const decrypted = await nip04.decrypt(keys.privateKeyHex, keys.publicKey, latest.content)
      const nextFriends = parseFriends(decrypted)

      setFriends(nextFriends)
      storage.set(STORAGE_KEYS.FRIENDS, JSON.stringify(nextFriends))
    } catch {
      // no-op
    } finally {
      setIsLoading(false)
    }
  }, [keys, pool, relays])

  const addFriend = useCallback(
    async (input: string): Promise<{ success: boolean; error?: string }> => {
      if (!keys) {
        return { success: false, error: 'Please generate or import your key first' }
      }

      const hexPubkey = resolvePubkey(input)
      if (!hexPubkey) {
        return { success: false, error: 'Please enter a valid npub or public key' }
      }

      if (friends.find((friend) => friend.pubkey === hexPubkey)) {
        return { success: false, error: 'Friend already added' }
      }

      try {
        const profile = await getProfile(hexPubkey)
        const nextFriend: Friend = {
          pubkey: hexPubkey,
          npub: nip19.npubEncode(hexPubkey),
          nickname: profile?.name?.trim() || `Friend ${hexPubkey.slice(0, 8)}`,
          picture: profile?.picture,
          addedAt: Math.floor(Date.now() / 1000),
        }

        await saveFriends([...friends, nextFriend])
        return { success: true }
      } catch {
        return { success: false, error: 'Failed to add friend' }
      }
    },
    [friends, getProfile, keys, saveFriends],
  )

  const removeFriend = useCallback(
    async (pubkey: string): Promise<void> => {
      const nextFriends = friends.filter((friend) => friend.pubkey !== pubkey)
      await saveFriends(nextFriends)
    },
    [friends, saveFriends],
  )

  return {
    friends,
    isLoading,
    addFriend,
    removeFriend,
    loadFriends,
    saveFriends,
  }
}
